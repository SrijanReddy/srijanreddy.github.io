#!/usr/bin/env python3
"""cross_check_tiles.py — Advanced tile investigator for Battle City CHR banks.

Investigates all 4 CHR banks (16KB) and maps them to stages using the 
Mapper 99 bank select logic ($4016 D2 polarity).

Usage:
    python cross_check_tiles.py --tile 0x10 0x12 0x22
    python cross_check_tiles.py --stage 1 --tile 0x10
    python cross_check_tiles.py --all-banks --tile 0xFC
"""

import sys
import argparse
import os

ROM_PATH = "../battlecity.nes"

# Mapper 99 StageFlagsTable ($80B6, 14 entries)
# D2=1 ($04) selects banks 0+1, D2=0 ($00) selects banks 2+3
STAGE_FLAGS = [0xec, 0x94, 0x00, 0xaa, 0xaa, 0xfc, 0xf0, 0xf8, 0xf8, 0xe8, 0x74, 0x0c, 0xf8, 0xfe]

# Polarity CONFIRMED by session 32 investigation:
# D2 set (bit 2) -> Banks 0+1
# D2 clear      -> Banks 2+3
def get_bank_pair(stage_idx):
    flags = STAGE_FLAGS[stage_idx % len(STAGE_FLAGS)]
    d2 = (flags >> 2) & 1
    return 0 if d2 == 1 else 1

SHADES = [' ', '░', '▒', '█']

def decode_tile(bank_data, tile_idx):
    offset = tile_idx * 16
    pixels = []
    for row in range(8):
        p0 = bank_data[offset + row]
        p1 = bank_data[offset + row + 8]
        for bit in range(7, -1, -1):
            c = ((p0 >> bit) & 1) | (((p1 >> bit) & 1) << 1)
            pixels.append(c)
    return pixels

def print_tile(pixels, label):
    print(f"--- {label} ---")
    print("  ┌────────────────┐")
    for row in range(8):
        line = ''.join(SHADES[pixels[row*8 + col]] * 2 for col in range(8))
        print(f"  │{line}│")
    print("  └────────────────┘")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--tile', nargs='+', help='Tile indices (hex/dec)')
    parser.add_argument('--range', nargs=2, type=lambda x: int(x, 0), metavar=('LO', 'HI'), help='Tile range')
    parser.add_argument('--stage', type=int, default=1, help='Stage number (1-35)')
    parser.add_argument('--all-banks', action='store_true', help='Dump from all 4 banks')
    parser.add_argument('--palette', action='store_true', help='Dump ROM palettes')
    args = parser.parse_args()

    if not os.path.exists(ROM_PATH):
        print(f"Error: {ROM_PATH} not found")
        sys.exit(1)

    with open(ROM_PATH, 'rb') as f:
        rom = f.read()

    prg_banks = rom[4]
    chr_off = 16 + prg_banks * 16384
    chr_data = rom[chr_off : chr_off + 16384]

    # Banks 0, 1, 2, 3 (4KB each)
    banks = [chr_data[i*4096 : (i+1)*4096] for i in range(4)]

    tiles = []
    if args.tile:
        tiles = [int(t, 0) for t in args.tile]
    if args.range:
        lo, hi = args.range
        tiles.extend(range(lo, hi + 1))

    if args.palette:
        print("=== ROM Palettes (at $D44A) ===")
        # NES MASTER PALETTE (from investigate_ui.py NES_RGB)
        NES_RGB = [
            (0x66,0x66,0x66), (0x00,0x2a,0x88), (0x14,0x12,0xa7), (0x3b,0x00,0xa4),
            (0x5c,0x00,0x7e), (0x6e,0x00,0x40), (0x6c,0x06,0x00), (0x56,0x1d,0x00),
            (0x33,0x35,0x00), (0x0b,0x48,0x00), (0x00,0x52,0x00), (0x00,0x4f,0x08),
            (0x00,0x40,0x4d), (0x00,0x00,0x00), (0x00,0x00,0x00), (0x00,0x00,0x00),
            (0xad,0xad,0xad), (0x15,0x5f,0xd9), (0x42,0x40,0xff), (0x75,0x27,0xfe),
            (0xbc,0x1a,0xd3), (0xd1,0x1f,0x8a), (0xd7,0x31,0x1d), (0xb5,0x52,0x00),
            (0x85,0x6d,0x00), (0x4b,0x83,0x00), (0x1a,0x91,0x00), (0x00,0x8d,0x31),
            (0x00,0x81,0x88), (0x00,0x00,0x00), (0x00,0x00,0x00), (0x00,0x00,0x00),
            (0xff,0xff,0xff), (0x64,0xb0,0xff), (0x92,0x90,0xff), (0xc6,0x76,0xff),
            (0xf3,0x6a,0xff), (0xfe,0x6e,0xcc), (0xfe,0x81,0x70), (0xea,0x9e,0x22),
            (0xbc,0xbe,0x00), (0x88,0xd8,0x00), (0x5c,0xe4,0x30), (0x45,0xe0,0x82),
            (0x48,0xcd,0xde), (0x4f,0x4f,0x4f), (0x00,0x00,0x00), (0x00,0x00,0x00),
            (0xff,0xff,0xff), (0xc0,0xdf,0xff), (0xd3,0xd2,0xff), (0xe8,0xc8,0xff),
            (0xfb,0xc2,0xff), (0xfe,0xc4,0xea), (0xfe,0xcc,0xc5), (0xf7,0xd8,0xa0),
            (0xe4,0xe5,0x94), (0xcf,0xef,0x96), (0xbd,0xf4,0xab), (0xb3,0xf3,0xcc),
            (0xb5,0xeb,0xf2), (0xb8,0xb8,0xb8), (0x00,0x00,0x00), (0x00,0x00,0x00)
        ]
        pal_off = 0xD44A - 0x8000 + 0x10 # Correct offset for 32KB PRG at 0x8010
        for i in range(8):
            bytes_ = rom[pal_off + i*4 : pal_off + (i+1)*4]
            hex_ = ' '.join(f'${b:02X}' for b in bytes_)
            print(f"  Palette {i}: {hex_}")
            for b in bytes_:
                rgb = NES_RGB[b & 0x3F]
                print(f"    ${b:02X} -> RGB({rgb[0]},{rgb[1]},{rgb[2]})")
        if not (args.tile or args.range):
            return

    if args.all_banks:
        for t in tiles:
            print(f"\nTile 0x{t:02X}:")
            for b_idx in range(4):
                pixels = decode_tile(banks[b_idx], t)
                print_tile(pixels, f"Bank {b_idx}")
    else:
        pair_idx = get_bank_pair(args.stage - 1)
        # Pair 0: PT0=Bank 0, PT1=Bank 1
        # Pair 1: PT0=Bank 2, PT1=Bank 3
        bg_bank_idx = 1 if pair_idx == 0 else 3
        spr_bank_idx = 0 if pair_idx == 0 else 2
        
        print(f"Stage {args.stage} uses Bank Pair {pair_idx}")
        print(f"  BG (PT1): Bank {bg_bank_idx}")
        print(f"  SPR (PT0): Bank {spr_bank_idx}")
        
        for t in tiles:
            print(f"\nTile 0x{t:02X}:")
            print_tile(decode_tile(banks[bg_bank_idx], t), "BG Patterns")
            print_tile(decode_tile(banks[spr_bank_idx], t), "Sprite Patterns")

if __name__ == "__main__":
    main()
