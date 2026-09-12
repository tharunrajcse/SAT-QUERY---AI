import os
import sys
import torch
import numpy as np
import cv2

# Ensure TinyCD directory is on sys.path to import change_classifier
TINYCD_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "TinyCD", "Tiny_model_4_CD"))
if TINYCD_ROOT not in sys.path:
    sys.path.append(TINYCD_ROOT)

from models.change_classifier import ChangeClassifier

class TinyCDInference:
    """
    Inference manager for TinyCD Bi-Temporal Change Detection model.
    """

    def __init__(self, model_path: str = None, device: str = None):
        if device is None:
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
        else:
            self.device = device

        if model_path is None:
            model_path = os.path.join(TINYCD_ROOT, "pretrained_models", "levir_best.pth")

        self.model_path = model_path
        self.model = self._load_model(model_path)
        self.mean = np.array([0.485, 0.456, 0.406], dtype=np.float32).reshape(1, 1, 3)
        self.std = np.array([0.229, 0.224, 0.225], dtype=np.float32).reshape(1, 1, 3)

    def _load_model(self, path: str) -> torch.nn.Module:
        model = ChangeClassifier()
        state_dict = torch.load(path, map_location=torch.device('cpu'))

        # Clean state_dict key discrepancies if loading WHU or custom weights
        clean_state_dict = {}
        for k, v in state_dict.items():
            # Fix WHU key variation where '_mixing._convmix' exists
            if "_mixing_mask.2._mixing._convmix" in k:
                k_clean = k.replace("_mixing_mask.2._mixing._convmix", "_mixing_mask.2._convmix")
                clean_state_dict[k_clean] = v
            else:
                clean_state_dict[k] = v

        model.load_state_dict(clean_state_dict, strict=False)
        model.eval()
        model.to(self.device)
        return model

    def predict(self, t1_rgb: np.ndarray, t2_rgb: np.ndarray, threshold: float = 0.5) -> dict:
        """
        Runs TinyCD change detection on T1 and T2 RGB numpy arrays (H, W, 3).
        Returns binary mask (0/255) and probability map (0..1).
        """
        h, w, c = t1_rgb.shape

        # Preprocess images (0..1 normalized and ImageNet standardized)
        t1_norm = ((t1_rgb.astype(np.float32) / 255.0) - self.mean) / self.std
        t2_norm = ((t2_rgb.astype(np.float32) / 255.0) - self.mean) / self.std

        t1_tensor = torch.from_numpy(t1_norm.transpose(2, 0, 1)).unsqueeze(0).float()
        t2_tensor = torch.from_numpy(t2_norm.transpose(2, 0, 1)).unsqueeze(0).float()

        # Handle tiling if image is large (>512x512)
        if h > 512 or w > 512:
            prob_map = self._predict_tiled(t1_tensor, t2_tensor, patch_size=512, stride=384)
        else:
            with torch.no_grad():
                t1_t = t1_tensor.to(self.device)
                t2_t = t2_tensor.to(self.device)
                out = self.model(t1_t, t2_t)
                prob_map = out.squeeze().cpu().numpy()

        # Thresholding
        binary_mask = (prob_map >= threshold).astype(np.uint8) * 255

        # Morphological noise cleanup
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        binary_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_OPEN, kernel)
        binary_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_CLOSE, kernel)

        return {
            "binary_mask": binary_mask,
            "probability_map": prob_map.astype(np.float32)
        }

    def _predict_tiled(self, t1_tensor: torch.Tensor, t2_tensor: torch.Tensor, patch_size=512, stride=384) -> np.ndarray:
        _, c, h, w = t1_tensor.shape
        prob_accum = np.zeros((h, w), dtype=np.float32)
        weight_accum = np.zeros((h, w), dtype=np.float32)

        # Create smooth patch weight window
        window = np.outer(np.hanning(patch_size), np.hanning(patch_size))

        y_coords = list(range(0, max(1, h - patch_size + 1), stride))
        if y_coords[-1] + patch_size < h:
            y_coords.append(h - patch_size)

        x_coords = list(range(0, max(1, w - patch_size + 1), stride))
        if x_coords[-1] + patch_size < w:
            x_coords.append(w - patch_size)

        with torch.no_grad():
            for y in y_coords:
                for x in x_coords:
                    t1_patch = t1_tensor[:, :, y:y+patch_size, x:x+patch_size].to(self.device)
                    t2_patch = t2_tensor[:, :, y:y+patch_size, x:x+patch_size].to(self.device)

                    ph, pw = t1_patch.shape[2], t1_patch.shape[3]
                    out_patch = self.model(t1_patch, t2_patch).squeeze().cpu().numpy()

                    w_patch = window[:ph, :pw]
                    prob_accum[y:y+ph, x:x+pw] += out_patch * w_patch
                    weight_accum[y:y+ph, x:x+pw] += w_patch

        weight_accum[weight_accum == 0] = 1.0
        return prob_accum / weight_accum
