#!/usr/bin/env python3
"""
Efficiently select the k-th element from a large JSON document
by filtering on model and type fields.
"""

import json
import argparse
import sys
import subprocess
import shutil
from typing import Optional, Dict, Any


def find_kth_element(
    filepath: str,
    k: int,
    model: str,
    element_type: str
) -> Optional[Dict[str, Any]]:
    """
    Find the k-th element (1-based indexing) matching the given model and type.
    
    Args:
        filepath: Path to the JSON file
        k: The index of the element to retrieve (1-based)
        model: The model value to filter by
        element_type: The type value to filter by
    
    Returns:
        The k-th matching element or None if not found
    """
    count = 0
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            # Read the file in chunks to handle large files
            data = json.load(f)
            
            # Handle if the root is an array
            if isinstance(data, list):
                items = data
            # Handle if the root is an object with an array field
            elif isinstance(data, dict):
                # Try common array field names
                items = data.get('output') or data.get('data') or data.get('items') or []
            else:
                print(f"Error: Unexpected JSON structure", file=sys.stderr)
                return None
            
            # Iterate through items
            for item in items:
                # Check if item matches the filter criteria
                if (isinstance(item, dict) and 
                    item.get('model') == model and 
                    item.get('type') == element_type):
                    count += 1
                    
                    # Return when we find the k-th match
                    if count == k:
                        return item['output'] if 'output' in item else item
            
            # If we get here, we didn't find k matching elements
            print(f"Warning: Only found {count} elements matching "
                  f"model='{model}' and type='{element_type}', "
                  f"but requested k={k}", file=sys.stderr)
            return None
            
    except FileNotFoundError:
        print(f"Error: File '{filepath}' not found", file=sys.stderr)
        return None
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in file: {e}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return None


def copy_to_clipboard(text: str) -> bool:
    """
    Copy text to clipboard using available utilities.
    
    Args:
        text: The text to copy
    
    Returns:
        True if successful, False otherwise
    """
    # Try wl-copy first (Wayland)
    if shutil.which('wl-copy'):
        try:
            subprocess.run(['wl-copy'], input=text.encode(), check=True)
            return True
        except subprocess.CalledProcessError:
            pass
    
    # Try xclip (X11)
    if shutil.which('xclip'):
        try:
            subprocess.run(
                ['xclip', '-selection', 'clipboard'],
                input=text.encode(),
                check=True
            )
            return True
        except subprocess.CalledProcessError:
            pass
    
    # Try xsel (X11)
    if shutil.which('xsel'):
        try:
            subprocess.run(
                ['xsel', '--clipboard'],
                input=text.encode(),
                check=True
            )
            return True
        except subprocess.CalledProcessError:
            pass
    
    print("Error: No clipboard utility found. Install xclip, xsel, or wl-clipboard.", 
          file=sys.stderr)
    return False


def main():
    parser = argparse.ArgumentParser(
        description='Select the k-th element from a JSON document by model and type',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s data.json -k 1 -m gpt-4 -t completion
  %(prog)s output.json --key 5 --model claude-3 --type chat
  %(prog)s results.json -k 3 -m llama2 -t generation --pretty
        """
    )
    
    parser.add_argument(
        'file',
        help='Path to the JSON file'
    )
    
    parser.add_argument(
        '-k', '--key',
        type=int,
        required=True,
        help='The index of the element to retrieve (1-based indexing)'
    )
    
    parser.add_argument(
        '-m', '--model',
        required=True,
        help='The model value to filter by'
    )
    
    parser.add_argument(
        '-t', '--type',
        required=True,
        help='The type value to filter by'
    )
    
    parser.add_argument(
        '--pretty',
        action='store_true',
        help='Pretty-print the JSON output'
    )
    
    parser.add_argument(
        '--clipboard',
        action='store_true',
        help='Copy output to clipboard (requires xclip, xsel, or wl-clipboard)'
    )
    
    args = parser.parse_args()
    
    # Validate k is positive
    if args.key < 1:
        print("Error: key must be >= 1 (1-based indexing)", file=sys.stderr)
        sys.exit(1)
    
    # Find the element
    result = find_kth_element(args.file, args.key, args.model, args.type)
    
    if result is not None:
        # Format the output
        if args.pretty:
            output = json.dumps(result, indent=2)
        else:
            output = json.dumps(result)
        
        # Copy to clipboard if requested
        if args.clipboard:
            copied = copy_to_clipboard(output)
            if copied:
                print("Output copied to clipboard!", file=sys.stderr)
            else:
                print("Failed to copy to clipboard. Printing output instead:", file=sys.stderr)
                print(output)
        else:
            print(output)
        
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == '__main__':
    main()