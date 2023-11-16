#!/bin/sh
# nock recorded response is returned as gzipped data. Nock is saving this data a hex encoded buffer string.
# To convert to json use this script.
#     ./nockDecode.sh <encoded>
#
# Example:
#     ./nockDecode.sh '1f','8b','08','00','00','00','00','00','00'

echo $1 | xxd -r -p | gunzip