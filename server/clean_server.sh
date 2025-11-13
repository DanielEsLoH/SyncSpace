#!/bin/bash
# Clean up server-side debugging and redundant comments

find app -name "*.rb" -type f | while read file; do
  # Remove debugging statements
  sed -i '' '/^[[:space:]]*puts /d' "$file"
  sed -i '' '/^[[:space:]]*p /d' "$file"
  sed -i '' '/^[[:space:]]*pp /d' "$file"
  sed -i '' '/Rails\.logger\.debug/d' "$file"
  
  # Remove excessive empty lines (more than 2 consecutive)
  perl -i -pe 's/\n\n\n+/\n\n/g' "$file"
done

echo "Server cleanup complete"
