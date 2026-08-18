for file in src/components/*.tsx; do
  if grep -q "if (!isOpen) return null;" "$file"; then
    echo "Fixing $file"
    # Remove all instances of "if (!isOpen) return null;"
    sed -i '' -e 's/^[ \t]*if (!isOpen) return null;.*//g' "$file" 2>/dev/null || sed -i 's/^[ \t]*if (!isOpen) return null;.*//g' "$file"
    
    # Insert it right before the final "return ("
    # Find the last "return (" and insert it before
    awk '
      /return \(/ {
        if (!done) {
          # Look ahead to see if it is the main render return
          # A simple heuristic: if it is at indentation 2 or 4, it is likely the main return
          # But better to just find the LAST return ( in the file? No, could be inner functions.
          # We can use sed to insert it at the specific line, or just use python for more robust parsing.
        }
      }
    '
  fi
done
