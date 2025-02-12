#!/bin/bash

# Set UTF-8 locale
export LANG=en_US.UTF-8

# Run pdflatex twice to ensure TOC is generated correctly
pdflatex -interaction=nonstopmode USER_GUIDE.tex
pdflatex -interaction=nonstopmode USER_GUIDE.tex

# Clean up auxiliary files
rm USER_GUIDE.aux USER_GUIDE.log USER_GUIDE.toc USER_GUIDE.out 