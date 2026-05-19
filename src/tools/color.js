// HSL and Hex math utilities

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
}

function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h * 360, s * 100, l * 100];
}

function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return [r * 255, g * 255, b * 255];
}

function luminance([r, g, b]) {
    const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function contrastRatio(hex1, hex2) {
    const lum1 = luminance(hexToRgb(hex1));
    const lum2 = luminance(hexToRgb(hex2));
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
}

function shiftHue(h, amount) {
    return (h + amount) % 360;
}

/**
 * Generate a cohesive color palette with contrast scores from a base hex color.
 * Produces complementary, analogous, and triadic palette colors using HSL math,
 * plus WCAG AA/AAA accessibility grading.
 * @param {string} baseHex - Base color in #RRGGBB format.
 * @returns {{ base: string, complementary: string, analogous: string[], triadic: string[], accessibility: { text_color: string, contrast_ratio: number, wcag_level: string } }}
 */
export function generateColorPalette(baseHex) {
    if (!/^#[0-9A-Fa-f]{6}$/.test(baseHex)) {
        throw new Error('Invalid hex code. Must be in #RRGGBB format.');
    }

    const rgb = hexToRgb(baseHex);
    const [h, s, l] = rgbToHsl(...rgb);

    const complementary = rgbToHex(...hslToRgb(shiftHue(h, 180), s, l));
    const analogous1 = rgbToHex(...hslToRgb(shiftHue(h, 30), s, l));
    const analogous2 = rgbToHex(...hslToRgb(shiftHue(h, 330), s, l));
    const triadic1 = rgbToHex(...hslToRgb(shiftHue(h, 120), s, l));
    const triadic2 = rgbToHex(...hslToRgb(shiftHue(h, 240), s, l));

    // WCAG AAA requires 7:1, AA requires 4.5:1
    const contrastWithWhite = contrastRatio(baseHex, "#FFFFFF");
    const contrastWithBlack = contrastRatio(baseHex, "#000000");

    const textPrimary = contrastWithWhite > contrastWithBlack ? "#FFFFFF" : "#000000";
    const contrast = contrastWithWhite > contrastWithBlack ? contrastWithWhite : contrastWithBlack;
    const wcagLevel = contrast >= 7.1 ? "AAA" : contrast >= 4.5 ? "AA" : "FAIL";

    return {
        base: baseHex.toUpperCase(),
        complementary: complementary.toUpperCase(),
        analogous: [analogous1.toUpperCase(), analogous2.toUpperCase()],
        triadic: [triadic1.toUpperCase(), triadic2.toUpperCase()],
        accessibility: {
            text_color: textPrimary,
            contrast_ratio: parseFloat(contrast.toFixed(2)),
            wcag_level: wcagLevel
        }
    };
}
