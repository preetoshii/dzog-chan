#!/usr/bin/env python3
"""Calculate centroid and bounding box for a triangle"""

# Triangle vertices
vertices = {
    "top": (72, 24),
    "bottom_left": (24, 108),
    "bottom_right": (120, 108)
}

# Extract coordinates
x1, y1 = vertices["top"]
x2, y2 = vertices["bottom_left"]
x3, y3 = vertices["bottom_right"]

print("Triangle vertices:")
print(f"  Top: ({x1}, {y1})")
print(f"  Bottom left: ({x2}, {y2})")
print(f"  Bottom right: ({x3}, {y3})")
print()

# Calculate centroid (average of all vertices)
centroid_x = (x1 + x2 + x3) / 3
centroid_y = (y1 + y2 + y3) / 3

print(f"Centroid: ({centroid_x:.2f}, {centroid_y:.2f})")
print()

# Calculate bounding box
min_x = min(x1, x2, x3)
max_x = max(x1, x2, x3)
min_y = min(y1, y2, y3)
max_y = max(y1, y2, y3)

bbox_width = max_x - min_x
bbox_height = max_y - min_y

print("Bounding box:")
print(f"  Top-left: ({min_x}, {min_y})")
print(f"  Bottom-right: ({max_x}, {max_y})")
print(f"  Width: {bbox_width}")
print(f"  Height: {bbox_height}")
print()

# Calculate center of bounding box
bbox_center_x = (min_x + max_x) / 2
bbox_center_y = (min_y + max_y) / 2

print(f"Bounding box center: ({bbox_center_x}, {bbox_center_y})")
print()

# Offset from bbox center to centroid
offset_x = centroid_x - bbox_center_x
offset_y = centroid_y - bbox_center_y
print(f"Offset from bbox center to centroid: ({offset_x:.2f}, {offset_y:.2f})")
print()

# Suggested viewBox dimensions (with padding)
padding = 20
viewbox_width = bbox_width + 2 * padding
viewbox_height = bbox_height + 2 * padding
viewbox_x = min_x - padding
viewbox_y = min_y - padding

print("Suggested SVG setup:")
print(f"  viewBox: \"{viewbox_x} {viewbox_y} {viewbox_width} {viewbox_height}\"")
print(f"  For rotation around centroid, use:")
print(f"    transform-origin: \"{centroid_x:.2f} {centroid_y:.2f}\"")
print()

# Alternative: Center triangle in viewBox
# Calculate translation to center the centroid in the viewBox
viewbox_center_x = viewbox_x + viewbox_width / 2
viewbox_center_y = viewbox_y + viewbox_height / 2
translate_x = viewbox_center_x - centroid_x
translate_y = viewbox_center_y - centroid_y

print("To center triangle in viewBox:")
print(f"  Translate all points by: ({translate_x:.2f}, {translate_y:.2f})")
print(f"  New vertices would be:")
print(f"    Top: ({x1 + translate_x:.2f}, {y1 + translate_y:.2f})")
print(f"    Bottom left: ({x2 + translate_x:.2f}, {y2 + translate_y:.2f})")
print(f"    Bottom right: ({x3 + translate_x:.2f}, {y3 + translate_y:.2f})")
print(f"  New centroid: ({centroid_x + translate_x:.2f}, {centroid_y + translate_y:.2f})")