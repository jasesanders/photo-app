#!/bin/bash
# Generate simple SVG placeholder images for development

generate_svg() {
  local dir="$1"
  local id="$2"
  local label="$3"
  local hue="$4"
  
  for width in 400 800 1200 1600 2400; do
    height=$((width * 2 / 3))
    cat > "public/images/${dir}/${id}-${width}w.jpeg" << EOF
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="hsl(${hue}, 25%, 65%)"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="serif" font-size="${width/10}" fill="hsl(${hue}, 25%, 30%)">${label}</text>
</svg>
EOF
  done
}

# Tokyo Spring
for i in $(seq 1 7); do
  generate_svg "2024/tokyo-spring" "$(printf '%03d' $i)" "Tokyo #$i" 350
done

# Portland Summer  
for i in $(seq 1 5); do
  generate_svg "2024/portland-summer" "$(printf '%03d' $i)" "Portland #$i" 140
done

# Mexico City
for i in $(seq 1 4); do
  generate_svg "2023/mexico-city" "$(printf '%03d' $i)" "CDMX #$i" 25
done

echo "Generated placeholder images"
