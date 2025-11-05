#!/bin/bash

tree -I "node_modules|venv|test|__pycache__" -L 5 > directory_structure.txt