import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch
import matplotlib.transforms as transforms
import numpy as np
from PIL import Image
import io
import os

ICONS_DIR = os.path.dirname(os.path.abspath(__file__))

fig, ax = plt.subplots(figsize=(6, 6))
ax.set_aspect('equal')
ax.axis('off')
ax.set_clip_on(False)

N = 14
R = 4.5
W = 2.4
H = 0.6
tilt_angle = 45
colors = "#0B7588"

for i in range(N):
    theta = i * (360 / N)
    theta_rad = np.radians(theta)
    cx = R * np.cos(theta_rad)
    cy = R * np.sin(theta_rad)
    angle = theta + 90 + tilt_angle
    t = transforms.Affine2D().rotate_deg(angle).translate(cx, cy) + ax.transData
    rect = FancyBboxPatch((-W/2, -H/2), W, H,
                          boxstyle="round,pad=0.3,rounding_size=0.3",
                          edgecolor=colors, facecolor=colors, lw=4,
                          transform=t, zorder=i, clip_on=False)
    ax.add_patch(rect)

theta_rad = 0
cx = R
cy = 0
angle = 90 + tilt_angle
t = transforms.Affine2D().rotate_deg(angle).translate(cx, cy) + ax.transData
rect_first = FancyBboxPatch((-W/2, -H/2), W, H,
                            boxstyle="round,pad=0.3,rounding_size=0.3",
                            edgecolor=colors, facecolor=colors, lw=4,
                            transform=t, zorder=N, clip_on=False)
ax.add_patch(rect_first)

# R(4.5) + 半對角線(1.615) + 小邊距 = 6.3
ax.set_xlim(-6.0, 6.0)
ax.set_ylim(-6.0, 6.0)

buf = io.BytesIO()
plt.savefig(buf, format='png', dpi=300, bbox_inches='tight',
            pad_inches=0.05, transparent=True)
plt.close()

buf.seek(0)
img = Image.open(buf)

for size in [16, 48, 128]:
    resized = img.resize((size, size), Image.LANCZOS)
    resized.save(os.path.join(ICONS_DIR, f"icon{size}.png"))
    print(f"Saved icon{size}.png")
