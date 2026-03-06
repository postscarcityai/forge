#!/bin/bash
# Framepack Batch Processing Script
# Generated for 11 transitions

echo "🎬 Starting framepack batch processing..."
echo "Processing 11 transitions in 9:16 aspect ratio"
echo "Style: Stop-motion with experimental handcrafted aesthetic"
echo ""

# Array to store generated video filenames
declare -a video_files=()


echo "🎯 Transition 1: Image 1 → Image 2"
echo "Processing transition 1/11..."

response_1=$(curl -X POST http://localhost:3000/api/framepack \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Stop motion animation sequence with experimental handcrafted aesthetic, jerky movements, frame-by-frame object repositioning, visible texture of materials, slight flickering and lighting shifts, choppy tactile imperfect motion",
    "image_url": "https://v3.fal.media/files/lion/h6EfknmL0fGdFa1zF3b18_f1686248ffb442289cd68dcbc8de2533.jpg",
    "end_image_url": "https://fal.media/files/elephant/MxOhhMMncHUOtJsrGwIsW_ae71e17e555d4620ba27eb7e619ed1d8.jpg",
    "aspect_ratio": "9:16",
    "resolution": "720p",
    "num_frames": 60,
    "strength": 0.8,
    "guidance_scale": 10,
    "save_to_disk": true
  }' \
  --silent | jq '.')
if [ $? -eq 0 ]; then
  echo "✅ Transition 1 completed successfully"
  local_path=$(echo "$response_1" | jq -r '.local_path // empty')
  if [ -n "$local_path" ]; then
    video_files+=("public/$local_path")
    echo "📁 Saved to: public/$local_path"
  fi
else
  echo "❌ Transition 1 failed"
fi

echo ""
sleep 2  # Brief pause between requests

echo "🎯 Transition 2: Image 2 → Image 3"
echo "Processing transition 2/11..."

response_2=$(curl -X POST http://localhost:3000/api/framepack \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Stop motion animation sequence with experimental handcrafted aesthetic, jerky movements, frame-by-frame object repositioning, visible texture of materials, slight flickering and lighting shifts, choppy tactile imperfect motion",
    "image_url": "https://fal.media/files/elephant/MxOhhMMncHUOtJsrGwIsW_ae71e17e555d4620ba27eb7e619ed1d8.jpg",
    "end_image_url": "https://fal.media/files/koala/0Rw_PpkXqTQDACyI4TdtH_3b86f76fd8474af19f5cdabf67a8102f.jpg",
    "aspect_ratio": "9:16",
    "resolution": "720p",
    "num_frames": 60,
    "strength": 0.8,
    "guidance_scale": 10,
    "save_to_disk": true
  }' \
  --silent | jq '.')
if [ $? -eq 0 ]; then
  echo "✅ Transition 2 completed successfully"
  local_path=$(echo "$response_2" | jq -r '.local_path // empty')
  if [ -n "$local_path" ]; then
    video_files+=("public/$local_path")
    echo "📁 Saved to: public/$local_path"
  fi
else
  echo "❌ Transition 2 failed"
fi

echo ""
sleep 2  # Brief pause between requests

echo "🎯 Transition 3: Image 3 → Image 4"
echo "Processing transition 3/11..."

response_3=$(curl -X POST http://localhost:3000/api/framepack \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Stop motion animation sequence with experimental handcrafted aesthetic, jerky movements, frame-by-frame object repositioning, visible texture of materials, slight flickering and lighting shifts, choppy tactile imperfect motion",
    "image_url": "https://fal.media/files/koala/0Rw_PpkXqTQDACyI4TdtH_3b86f76fd8474af19f5cdabf67a8102f.jpg",
    "end_image_url": "https://fal.media/files/kangaroo/_VRS9wnA2V84JL4w-4LpB_74558960616848a48ad4305237f5c339.jpg",
    "aspect_ratio": "9:16",
    "resolution": "720p",
    "num_frames": 60,
    "strength": 0.8,
    "guidance_scale": 10,
    "save_to_disk": true
  }' \
  --silent | jq '.')
if [ $? -eq 0 ]; then
  echo "✅ Transition 3 completed successfully"
  local_path=$(echo "$response_3" | jq -r '.local_path // empty')
  if [ -n "$local_path" ]; then
    video_files+=("public/$local_path")
    echo "📁 Saved to: public/$local_path"
  fi
else
  echo "❌ Transition 3 failed"
fi

echo ""
sleep 2  # Brief pause between requests

echo "🎯 Transition 4: Image 4 → Image 5"
echo "Processing transition 4/11..."

response_4=$(curl -X POST http://localhost:3000/api/framepack \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Stop motion animation sequence with experimental handcrafted aesthetic, jerky movements, frame-by-frame object repositioning, visible texture of materials, slight flickering and lighting shifts, choppy tactile imperfect motion",
    "image_url": "https://fal.media/files/kangaroo/_VRS9wnA2V84JL4w-4LpB_74558960616848a48ad4305237f5c339.jpg",
    "end_image_url": "https://fal.media/files/kangaroo/MrHkcBrttJBHDepXHWloj_7c1d17b24c2c477caa19f7f16919fd6a.jpg",
    "aspect_ratio": "9:16",
    "resolution": "720p",
    "num_frames": 60,
    "strength": 0.8,
    "guidance_scale": 10,
    "save_to_disk": true
  }' \
  --silent | jq '.')
if [ $? -eq 0 ]; then
  echo "✅ Transition 4 completed successfully"
  local_path=$(echo "$response_4" | jq -r '.local_path // empty')
  if [ -n "$local_path" ]; then
    video_files+=("public/$local_path")
    echo "📁 Saved to: public/$local_path"
  fi
else
  echo "❌ Transition 4 failed"
fi

echo ""
sleep 2  # Brief pause between requests

echo "🎯 Transition 5: Image 5 → Image 6"
echo "Processing transition 5/11..."

response_5=$(curl -X POST http://localhost:3000/api/framepack \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Stop motion animation sequence with experimental handcrafted aesthetic, jerky movements, frame-by-frame object repositioning, visible texture of materials, slight flickering and lighting shifts, choppy tactile imperfect motion",
    "image_url": "https://fal.media/files/kangaroo/MrHkcBrttJBHDepXHWloj_7c1d17b24c2c477caa19f7f16919fd6a.jpg",
    "end_image_url": "https://fal.media/files/monkey/3Ns2J7vRnu-4nVufXlbpS_1708acce6414432ebd908cdf92dfdc0a.jpg",
    "aspect_ratio": "9:16",
    "resolution": "720p",
    "num_frames": 60,
    "strength": 0.8,
    "guidance_scale": 10,
    "save_to_disk": true
  }' \
  --silent | jq '.')
if [ $? -eq 0 ]; then
  echo "✅ Transition 5 completed successfully"
  local_path=$(echo "$response_5" | jq -r '.local_path // empty')
  if [ -n "$local_path" ]; then
    video_files+=("public/$local_path")
    echo "📁 Saved to: public/$local_path"
  fi
else
  echo "❌ Transition 5 failed"
fi

echo ""
sleep 2  # Brief pause between requests

echo "🎯 Transition 6: Image 6 → Image 7"
echo "Processing transition 6/11..."

response_6=$(curl -X POST http://localhost:3000/api/framepack \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Stop motion animation sequence with experimental handcrafted aesthetic, jerky movements, frame-by-frame object repositioning, visible texture of materials, slight flickering and lighting shifts, choppy tactile imperfect motion",
    "image_url": "https://fal.media/files/monkey/3Ns2J7vRnu-4nVufXlbpS_1708acce6414432ebd908cdf92dfdc0a.jpg",
    "end_image_url": "https://fal.media/files/elephant/7joEiK22j7DWtNzg-5yRT_2c2943f0b15142f0abb472d39d74db94.jpg",
    "aspect_ratio": "9:16",
    "resolution": "720p",
    "num_frames": 60,
    "strength": 0.8,
    "guidance_scale": 10,
    "save_to_disk": true
  }' \
  --silent | jq '.')
if [ $? -eq 0 ]; then
  echo "✅ Transition 6 completed successfully"
  local_path=$(echo "$response_6" | jq -r '.local_path // empty')
  if [ -n "$local_path" ]; then
    video_files+=("public/$local_path")
    echo "📁 Saved to: public/$local_path"
  fi
else
  echo "❌ Transition 6 failed"
fi

echo ""
sleep 2  # Brief pause between requests

echo "🎯 Transition 7: Image 7 → Image 8"
echo "Processing transition 7/11..."

response_7=$(curl -X POST http://localhost:3000/api/framepack \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Stop motion animation sequence with experimental handcrafted aesthetic, jerky movements, frame-by-frame object repositioning, visible texture of materials, slight flickering and lighting shifts, choppy tactile imperfect motion",
    "image_url": "https://fal.media/files/elephant/7joEiK22j7DWtNzg-5yRT_2c2943f0b15142f0abb472d39d74db94.jpg",
    "end_image_url": "https://fal.media/files/lion/whwUsHs7RKytVb5S8TJIt_fc7609b0d20347ac81581b5a6bb074ed.jpg",
    "aspect_ratio": "9:16",
    "resolution": "720p",
    "num_frames": 60,
    "strength": 0.8,
    "guidance_scale": 10,
    "save_to_disk": true
  }' \
  --silent | jq '.')
if [ $? -eq 0 ]; then
  echo "✅ Transition 7 completed successfully"
  local_path=$(echo "$response_7" | jq -r '.local_path // empty')
  if [ -n "$local_path" ]; then
    video_files+=("public/$local_path")
    echo "📁 Saved to: public/$local_path"
  fi
else
  echo "❌ Transition 7 failed"
fi

echo ""
sleep 2  # Brief pause between requests

echo "🎯 Transition 8: Image 8 → Image 9"
echo "Processing transition 8/11..."

response_8=$(curl -X POST http://localhost:3000/api/framepack \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Stop motion animation sequence with experimental handcrafted aesthetic, jerky movements, frame-by-frame object repositioning, visible texture of materials, slight flickering and lighting shifts, choppy tactile imperfect motion",
    "image_url": "https://fal.media/files/lion/whwUsHs7RKytVb5S8TJIt_fc7609b0d20347ac81581b5a6bb074ed.jpg",
    "end_image_url": "https://fal.media/files/elephant/7U_3W07P4MkR5THiMUZAN_ae235424eabb4be59b8d2a98343141cc.jpg",
    "aspect_ratio": "9:16",
    "resolution": "720p",
    "num_frames": 60,
    "strength": 0.8,
    "guidance_scale": 10,
    "save_to_disk": true
  }' \
  --silent | jq '.')
if [ $? -eq 0 ]; then
  echo "✅ Transition 8 completed successfully"
  local_path=$(echo "$response_8" | jq -r '.local_path // empty')
  if [ -n "$local_path" ]; then
    video_files+=("public/$local_path")
    echo "📁 Saved to: public/$local_path"
  fi
else
  echo "❌ Transition 8 failed"
fi

echo ""
sleep 2  # Brief pause between requests

echo "🎯 Transition 9: Image 9 → Image 10"
echo "Processing transition 9/11..."

response_9=$(curl -X POST http://localhost:3000/api/framepack \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Stop motion animation sequence with experimental handcrafted aesthetic, jerky movements, frame-by-frame object repositioning, visible texture of materials, slight flickering and lighting shifts, choppy tactile imperfect motion",
    "image_url": "https://fal.media/files/elephant/7U_3W07P4MkR5THiMUZAN_ae235424eabb4be59b8d2a98343141cc.jpg",
    "end_image_url": "https://fal.media/files/kangaroo/dxy7_6lCBTfUExTTay1lw_16ec26884a374906b4682e62407bd698.jpg",
    "aspect_ratio": "9:16",
    "resolution": "720p",
    "num_frames": 60,
    "strength": 0.8,
    "guidance_scale": 10,
    "save_to_disk": true
  }' \
  --silent | jq '.')
if [ $? -eq 0 ]; then
  echo "✅ Transition 9 completed successfully"
  local_path=$(echo "$response_9" | jq -r '.local_path // empty')
  if [ -n "$local_path" ]; then
    video_files+=("public/$local_path")
    echo "📁 Saved to: public/$local_path"
  fi
else
  echo "❌ Transition 9 failed"
fi

echo ""
sleep 2  # Brief pause between requests

echo "🎯 Transition 10: Image 10 → Image 11"
echo "Processing transition 10/11..."

response_10=$(curl -X POST http://localhost:3000/api/framepack \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Stop motion animation sequence with experimental handcrafted aesthetic, jerky movements, frame-by-frame object repositioning, visible texture of materials, slight flickering and lighting shifts, choppy tactile imperfect motion",
    "image_url": "https://fal.media/files/kangaroo/dxy7_6lCBTfUExTTay1lw_16ec26884a374906b4682e62407bd698.jpg",
    "end_image_url": "https://fal.media/files/elephant/D7qno-EmL_Vlz2g_QxId5_b7525011dedd4054a43015c1255c1d99.jpg",
    "aspect_ratio": "9:16",
    "resolution": "720p",
    "num_frames": 60,
    "strength": 0.8,
    "guidance_scale": 10,
    "save_to_disk": true
  }' \
  --silent | jq '.')
if [ $? -eq 0 ]; then
  echo "✅ Transition 10 completed successfully"
  local_path=$(echo "$response_10" | jq -r '.local_path // empty')
  if [ -n "$local_path" ]; then
    video_files+=("public/$local_path")
    echo "📁 Saved to: public/$local_path"
  fi
else
  echo "❌ Transition 10 failed"
fi

echo ""
sleep 2  # Brief pause between requests

echo "🎯 Transition 11: Image 11 → Image 12"
echo "Processing transition 11/11..."

response_11=$(curl -X POST http://localhost:3000/api/framepack \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Stop motion animation sequence with experimental handcrafted aesthetic, jerky movements, frame-by-frame object repositioning, visible texture of materials, slight flickering and lighting shifts, choppy tactile imperfect motion",
    "image_url": "https://fal.media/files/elephant/D7qno-EmL_Vlz2g_QxId5_b7525011dedd4054a43015c1255c1d99.jpg",
    "end_image_url": "https://v3.fal.media/files/penguin/3ywayCgtRE1RkUTfpQMAj_9cc3b2f45a064da59bce8a555be170ff.jpg",
    "aspect_ratio": "9:16",
    "resolution": "720p",
    "num_frames": 60,
    "strength": 0.8,
    "guidance_scale": 10,
    "save_to_disk": true
  }' \
  --silent | jq '.')
if [ $? -eq 0 ]; then
  echo "✅ Transition 11 completed successfully"
  local_path=$(echo "$response_11" | jq -r '.local_path // empty')
  if [ -n "$local_path" ]; then
    video_files+=("public/$local_path")
    echo "📁 Saved to: public/$local_path"
  fi
else
  echo "❌ Transition 11 failed"
fi

echo ""
sleep 2  # Brief pause between requests

echo "🎞️ All framepack transitions completed!"
echo "Generated ${#video_files[@]} video files:"

# Create file list for ffmpeg concatenation
echo "📝 Creating ffmpeg concat list..."
concat_file="public/videos/framepack_batch_concat_$(date +%Y%m%d_%H%M%S).txt"

for video_file in "${video_files[@]}"; do
  if [ -f "$video_file" ]; then
    echo "file '$video_file'" >> "$concat_file"
    echo "  - $video_file"
  fi
done

echo ""
echo "🎬 Stitching videos together with ffmpeg..."

final_output="public/videos/framepack_stop_motion_sequence_$(date +%Y%m%d_%H%M%S).mp4"

ffmpeg -f concat -safe 0 -i "$concat_file" -c copy "$final_output"

if [ $? -eq 0 ]; then
  echo "🎉 Final video created successfully: $final_output"
  echo ""
  echo "📊 Video Details:"
  echo "  - Aspect Ratio: 9:16 (Portrait)"
  echo "  - Resolution: 720p"
  echo "  - Style: Stop-motion experimental"
  echo "  - Transitions: 11"
  echo "  - Total Images: 12"
  echo ""
  echo "🎯 You can find your final video at: $final_output"
else
  echo "❌ Error creating final video"
  echo "💡 Individual transitions are available in: public/videos/"
  echo "💡 Concat file for manual processing: $concat_file"
fi

echo ""
echo "🧹 Cleaning up..."
echo "Individual framepack files are preserved in public/videos/"
echo "Concat list saved to: $concat_file"
echo ""
echo "✨ Framepack batch processing complete!"
