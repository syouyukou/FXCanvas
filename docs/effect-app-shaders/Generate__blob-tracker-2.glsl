

// @processor=blobtracker channel=2

uniform int debugMask;     // label=debug mask, value=0, ui=switch, random=0, desc=show the mask as the blob tracker reads it
uniform int boxColorMode;     // label=random palette, value=1, ui=switch, desc=use palette colors instead of one shared box color
uniform vec3 boxColor;        // label=box color, value=(0.0, 0.95, 1.0), ui=color, desc=shared color when box color mode is single color
uniform float boxPalette;     // label=palette set, value=0, min=0, max=3, step=1, desc=0 current, 1 retro, 2 neon, 3 soft
uniform float boxType;        // label=box type, value=1, min=0, max=3, step=1, desc=0 none, 1 full, 2 angles, 3 circle, pro
uniform int boxBlendMode;     // label=box blend, value=0, ui=dropdown, options=[Default:0|Mask on black:1|Invert inside:2]
uniform float boxThickness;   // label=box thickness px, value=1.5, min=0.5, max=8.0, step=0.5, desc=outline width in screen pixels
uniform float boxOpacity;     // label=box outline opacity, value=1.0, min=0.0, max=1.0, step=0.05
uniform float boxFillOpacity; // label=box fill opacity, value=0.12, min=0.0, max=1.0, step=0.02, desc=interior tint under the outline
uniform float centerType;     // label=center type, value=4, min=0, max=4, step=1, desc=0 off, 1 circle, 2 quad, 3 cross, 4 plus
uniform float centerSize;     // label=center size px, value=3.0, min=1.0, max=16.0, step=0.5, desc=centroid marker size in pixels

uniform float captionType;       // label=caption position, value=1, min=0, max=8, step=1, desc=0 none, 1 top-left, 2 top-right, 3 bottom-left, 4 bottom-right, 5 left, 6 right, 7 top, 8 bottom
uniform float captionSize;       // label=caption size px, value=22.0, min=6.0, max=48.0, step=1.0
uniform float captionBgOpacity;  // label=caption bg opacity, value=0.45, min=0.0, max=1.0, step=0.05

uniform float lineType;       // label=line type, value=1, min=0, max=3, step=1, desc=0 none, 1 straight, 2 arch, 3 smooth, pro
uniform float lineStyle;      // label=line style, value=2, min=0, max=3, step=1, desc=0 solid, 1 arrow, 2 dashed, 3 dashed arrow, pro

const int MAX_TRACKS = 32;
const int BEZIER_STEPS = 16;
const vec2 CAPTION_ATLAS_SIZE = vec2(1024.0, 240.0);
const vec2 CAPTION_CELL_PX = vec2(64.0, 80.0);
const float CAPTION_MSDF_RANGE = 2.0;
const float CAPTION_CELL_PAD_PX = 1.0;
const float CAPTION_GLYPH_SCALE = 0.9;
const float LINE_THICKNESS_PX = 1.5;
const float LINE_OPACITY = 0.8;
const float DASH_ON_PX = 10.0;
const float DASH_OFF_PX = 6.0;
const float ARROW_LENGTH_PX = 12.0;
const float ARROW_WIDTH_PX = 8.0;

float luminance(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
}

vec2 analysisDims() {
    float aw = 160.0;
    float ah = max(1.0, floor(aw * iResolution.y / max(iResolution.x, 1.0) + 0.5));
    return vec2(aw, ah);
}


vec4 analysisMaskTexel(vec2 uv) {
    vec2 as = analysisDims();
    ivec2 p = ivec2(clamp(floor(uv * as), vec2(0.0), as - 1.0));
    return texelFetch(iChannel0, p, 0);
}

float displayDetectionMask(vec2 uv) {
    return step(0.5, analysisMaskTexel(uv).r);
}

vec3 overlayColorFromHueByteNorm(float hueByteNorm) {
    float hue = hueByteNorm * 360.0;
    float c = 0.95;
    float x = c * (1.0 - abs(mod(hue / 60.0, 2.0) - 1.0));
    float m = 0.05;
    vec3 rgb;
    if (hue < 60.0) rgb = vec3(c, x, 0.0);
    else if (hue < 120.0) rgb = vec3(x, c, 0.0);
    else if (hue < 180.0) rgb = vec3(0.0, c, x);
    else if (hue < 240.0) rgb = vec3(0.0, x, c);
    else if (hue < 300.0) rgb = vec3(x, 0.0, c);
    else rgb = vec3(c, 0.0, x);
    return clamp(rgb + m, 0.0, 1.0);
}

vec3 paletteColor(int palette, int index) {
    int i = int(mod(float(index), 6.0));

    if (palette == 1) {
        if (i == 0) return vec3(0.93, 0.33, 0.23);
        if (i == 1) return vec3(0.96, 0.70, 0.27);
        if (i == 2) return vec3(0.28, 0.63, 0.50);
        if (i == 3) return vec3(0.16, 0.35, 0.47);
        if (i == 4) return vec3(0.55, 0.28, 0.41);
        return vec3(0.98, 0.88, 0.55);
    }

    if (palette == 2) {
        if (i == 0) return vec3(0.00, 0.95, 1.00);
        if (i == 1) return vec3(1.00, 0.10, 0.82);
        if (i == 2) return vec3(0.62, 1.00, 0.00);
        if (i == 3) return vec3(1.00, 0.58, 0.00);
        if (i == 4) return vec3(0.46, 0.28, 1.00);
        return vec3(1.00, 0.95, 0.10);
    }

    if (i == 0) return vec3(0.58, 0.75, 1.00);
    if (i == 1) return vec3(1.00, 0.66, 0.78);
    if (i == 2) return vec3(0.72, 0.92, 0.67);
    if (i == 3) return vec3(0.97, 0.82, 0.55);
    if (i == 4) return vec3(0.78, 0.68, 1.00);
    return vec3(0.55, 0.91, 0.89);
}

vec3 trackColor(float hueByteNorm) {
    if (boxColorMode == 0) return clamp(boxColor, 0.0, 1.0);

    int palette = int(floor(boxPalette + 0.5));
    if (palette <= 0) return overlayColorFromHueByteNorm(hueByteNorm);

    int colorIndex = int(floor(fract(hueByteNorm) * 6.0));
    return paletteColor(palette, colorIndex);
}

float dashMask(float alongPx, int style) {
    if (style < 2) return 1.0;
    float phase = mod(alongPx, DASH_ON_PX + DASH_OFF_PX);
    return 1.0 - step(DASH_ON_PX, phase);
}

float segmentStrokeAlpha(vec2 p, vec2 a, vec2 b, float baseAlongPx, int style) {
    vec2 ab = b - a;
    float len = max(length(ab), 1e-6);
    float t = clamp(dot(p - a, ab) / (len * len), 0.0, 1.0);
    vec2 proj = a + ab * t;
    float d = length(p - proj);
    float stroke = smoothstep(LINE_THICKNESS_PX, LINE_THICKNESS_PX - 1.0, d);
    return stroke * dashMask(baseAlongPx + t * len, style);
}

float segmentAlphaPx(vec2 p, vec2 a, vec2 b, float thicknessPx) {
    vec2 ab = b - a;
    float len = max(length(ab), 1e-6);
    float t = clamp(dot(p - a, ab) / (len * len), 0.0, 1.0);
    vec2 proj = a + ab * t;
    float d = length(p - proj);
    return smoothstep(thicknessPx, thicknessPx - 1.0, d);
}

float boxShapeAlpha(vec2 p, vec4 bounds, int type) {
    if (type <= 0) return 0.0;

    float x0 = bounds.x;
    float y0 = bounds.y;
    float x1 = bounds.z;
    float y1 = bounds.w;
    float w = max(x1 - x0, 1.0);
    float h = max(y1 - y0, 1.0);
    float thick = max(boxThickness, 0.5);

    if (type == 1) {
        bool inside = (p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1);
        float distEdge = inside
            ? min(min(p.x - x0, x1 - p.x), min(p.y - y0, y1 - p.y))
            : -1.0;
        float fillA = inside ? boxFillOpacity : 0.0;
        float borderA = (inside && distEdge < thick) ? boxOpacity : 0.0;
        return max(fillA, borderA);
    }

    if (type == 2) {
        float len = clamp(min(w, h) * 0.25, 8.0, 32.0);
        float a = 0.0;
        a = max(a, segmentAlphaPx(p, vec2(x0, y0), vec2(x0 + len, y0), thick));
        a = max(a, segmentAlphaPx(p, vec2(x0, y0), vec2(x0, y0 + len), thick));
        a = max(a, segmentAlphaPx(p, vec2(x1, y0), vec2(x1 - len, y0), thick));
        a = max(a, segmentAlphaPx(p, vec2(x1, y0), vec2(x1, y0 + len), thick));
        a = max(a, segmentAlphaPx(p, vec2(x0, y1), vec2(x0 + len, y1), thick));
        a = max(a, segmentAlphaPx(p, vec2(x0, y1), vec2(x0, y1 - len), thick));
        a = max(a, segmentAlphaPx(p, vec2(x1, y1), vec2(x1 - len, y1), thick));
        a = max(a, segmentAlphaPx(p, vec2(x1, y1), vec2(x1, y1 - len), thick));
        float fillA = (p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1) ? boxFillOpacity : 0.0;
        return max(fillA, a * boxOpacity);
    }

    vec2 c = vec2((x0 + x1) * 0.5, (y0 + y1) * 0.5);
    float r = max(w, h) * 0.5;
    float d = abs(length(p - c) - r);
    float borderA = (1.0 - smoothstep(thick, thick + 1.0, d)) * boxOpacity;
    float fillA = (length(p - c) <= r) ? boxFillOpacity : 0.0;
    return max(fillA, borderA);
}

float arrowAlpha(vec2 p, vec2 tip, vec2 prev) {
    vec2 arrowVec = tip - prev;
    float arrowLen = length(arrowVec);
    if (arrowLen < 1e-3) return 0.0;
    vec2 dir = arrowVec / arrowLen;
    vec2 rel = p - tip;
    float back = -dot(rel, dir);
    vec2 perp = vec2(-dir.y, dir.x);
    float side = abs(dot(rel, perp));
    float halfWidth = (back / ARROW_LENGTH_PX) * (ARROW_WIDTH_PX * 0.5);
    float body = step(0.0, back) * (1.0 - step(ARROW_LENGTH_PX, back));
    float width = 1.0 - smoothstep(halfWidth, halfWidth + 1.0, side);
    return body * width;
}

float lineAlphaStraight(vec2 p, vec2 a, vec2 b, int style) {
    float alpha = segmentStrokeAlpha(p, a, b, 0.0, style);
    if (style == 1 || style == 3) {
        alpha = max(alpha, arrowAlpha(p, b, a));
    }
    return alpha;
}

vec2 quadPoint(vec2 a, vec2 c, vec2 b, float t) {
    float omt = 1.0 - t;
    return omt * omt * a + 2.0 * omt * t * c + t * t * b;
}

float lineAlphaQuad(vec2 p, vec2 a, vec2 c, vec2 b, int style) {
    float alpha = 0.0;
    float along = 0.0;
    vec2 prev = a;
    vec2 beforeTip = a;
    for (int i = 1; i <= BEZIER_STEPS; i++) {
        float t = float(i) / float(BEZIER_STEPS);
        vec2 cur = quadPoint(a, c, b, t);
        alpha = max(alpha, segmentStrokeAlpha(p, prev, cur, along, style));
        along += length(cur - prev);
        beforeTip = prev;
        prev = cur;
    }
    if (style == 1 || style == 3) {
        alpha = max(alpha, arrowAlpha(p, b, beforeTip));
    }
    return alpha;
}

vec2 cubicPoint(vec2 a, vec2 c1, vec2 c2, vec2 b, float t) {
    float omt = 1.0 - t;
    float omt2 = omt * omt;
    float t2 = t * t;
    return omt2 * omt * a
         + 3.0 * omt2 * t  * c1
         + 3.0 * omt  * t2 * c2
         + t2 * t * b;
}

float lineAlphaCubic(vec2 p, vec2 a, vec2 c1, vec2 c2, vec2 b, int style) {
    float alpha = 0.0;
    float along = 0.0;
    vec2 prev = a;
    vec2 beforeTip = a;
    for (int i = 1; i <= BEZIER_STEPS; i++) {
        float t = float(i) / float(BEZIER_STEPS);
        vec2 cur = cubicPoint(a, c1, c2, b, t);
        alpha = max(alpha, segmentStrokeAlpha(p, prev, cur, along, style));
        along += length(cur - prev);
        beforeTip = prev;
        prev = cur;
    }
    if (style == 1 || style == 3) {
        alpha = max(alpha, arrowAlpha(p, b, beforeTip));
    }
    return alpha;
}

float centerMarkerAlpha(vec2 p, vec2 center, int type, float sizePx) {
    if (type <= 0) return 0.0;

    vec2 d = p - center;
    float r = max(sizePx, 1.0);
    float halfArm = r * 1.6;
    float thick = max(0.75, r * 0.18);

    if (type == 1) {
        return 1.0 - smoothstep(r, r + 1.0, length(d));
    }
    if (type == 2) {
        vec2 ad = abs(d);
        float boxDist = max(ad.x, ad.y);
        return 1.0 - smoothstep(r, r + 1.0, boxDist);
    }
    if (type == 3) {
        float diagA = abs(d.x - d.y) * 0.7071068;
        float diagB = abs(d.x + d.y) * 0.7071068;
        float extent = step(max(abs(d.x), abs(d.y)), halfArm);
        float mark = 1.0 - smoothstep(thick, thick + 1.0, min(diagA, diagB));
        return mark * extent;
    }

    float barX = (1.0 - smoothstep(thick, thick + 1.0, abs(d.x))) * step(abs(d.y), halfArm);
    float barY = (1.0 - smoothstep(thick, thick + 1.0, abs(d.y))) * step(abs(d.x), halfArm);
    return max(barX, barY);
}

float median3(vec3 v) {
    return max(min(v.x, v.y), min(max(v.x, v.y), v.z));
}

float sampleCaptionMSDF(vec2 uv) {
    vec3 msdfTex = texture(iChannel5, uv).rgb;
    float sd = median3(msdfTex) - 0.5;
    vec2 duv = fwidth(uv);
    float screenPxRange = max(0.5 * dot(duv * CAPTION_ATLAS_SIZE, vec2(1.0)), 1.0);
    return clamp(sd * CAPTION_MSDF_RANGE * screenPxRange + 0.5, 0.0, 1.0);
}

vec2 captionGlyphBaseUV(int glyphIndex) {
    int col = glyphIndex % 16;
    int row = glyphIndex / 16;
    vec2 cellOriginPx = vec2(float(col) * CAPTION_CELL_PX.x, float(row) * CAPTION_CELL_PX.y);
    return cellOriginPx / CAPTION_ATLAS_SIZE;
}

float captionGlyph(int glyphIndex, vec2 localUV, vec2 cellSizePx) {
    if (glyphIndex < 0 || glyphIndex >= 36) return 0.0;

    vec2 posPx = (localUV - 0.5) * cellSizePx;
    float hGlyphPx = cellSizePx.y * CAPTION_GLYPH_SCALE;
    float glyphAspect = CAPTION_CELL_PX.x / CAPTION_CELL_PX.y;
    float wGlyphPx = hGlyphPx * glyphAspect;
    vec2 glyphUV = posPx / vec2(wGlyphPx, hGlyphPx) + 0.5;

    if (glyphUV.x < 0.0 || glyphUV.x > 1.0 || glyphUV.y < 0.0 || glyphUV.y > 1.0) {
        return 0.0;
    }

    vec2 baseUV = captionGlyphBaseUV(glyphIndex);
    vec2 padUV = vec2(CAPTION_CELL_PAD_PX) / CAPTION_ATLAS_SIZE;
    vec2 innerSizeUV = (CAPTION_CELL_PX - 2.0 * vec2(CAPTION_CELL_PAD_PX)) / CAPTION_ATLAS_SIZE;
    return sampleCaptionMSDF(baseUV + padUV + glyphUV * innerSizeUV);
}

int captionGlyphForCenterPos(int centerX, int centerY, int charPos) {
    int x = clamp(centerX, 0, 999);
    int y = clamp(centerY, 0, 999);
    if (charPos == 0) return 33; 
    if (charPos == 1) return (x / 100) % 10;
    if (charPos == 2) return (x / 10) % 10;
    if (charPos == 3) return x % 10;
    if (charPos == 4) return 34; 
    if (charPos == 5) return (y / 100) % 10;
    if (charPos == 6) return (y / 10) % 10;
    return y % 10;
}

float captionTextMask(vec2 fragCoord, vec2 anchor, int centerX, int centerY, float sizePx) {
    float charAdvance = sizePx * 0.48;
    vec2 glyphSize = vec2(sizePx * 0.72, sizePx);
    vec2 textSize = vec2(charAdvance * 7.0 + glyphSize.x, glyphSize.y);
    vec2 rel = fragCoord - anchor;

    if (rel.x < 0.0 || rel.y < 0.0 || rel.x >= textSize.x || rel.y >= textSize.y) return 0.0;

    float mask = 0.0;
    for (int charPos = 0; charPos < 8; charPos++) {
        vec2 glyphRel = rel - vec2(float(charPos) * charAdvance, 0.0);
        if (glyphRel.x < 0.0 || glyphRel.y < 0.0 || glyphRel.x >= glyphSize.x || glyphRel.y >= glyphSize.y) continue;
        vec2 localUV = glyphRel / glyphSize;
        mask = max(mask, captionGlyph(captionGlyphForCenterPos(centerX, centerY, charPos), localUV, glyphSize));
    }
    return mask;
}

float captionBgMask(vec2 fragCoord, vec2 anchor, float sizePx) {
    vec2 pad = vec2(2.0, 1.0);
    float charAdvance = sizePx * 0.48;
    vec2 glyphSize = vec2(sizePx * 0.72, sizePx);
    vec2 textSize = vec2(charAdvance * 7.0 + glyphSize.x, glyphSize.y);
    vec2 rel = fragCoord - anchor;
    vec2 minP = -pad;
    vec2 maxP = textSize + pad;
    return (rel.x >= minP.x && rel.y >= minP.y && rel.x <= maxP.x && rel.y <= maxP.y) ? 1.0 : 0.0;
}

vec2 captionAnchor(int type, vec4 bounds, vec2 textSize, vec2 pad) {
    float x0 = bounds.x;
    float y0 = bounds.y;
    float x1 = bounds.z;
    float y1 = bounds.w;
    vec2 center = vec2((x0 + x1) * 0.5, (y0 + y1) * 0.5);
    float centerGap = max(centerSize * 3.2, 6.0);
    vec2 anchor;

    if (type == 2) {
        anchor = vec2(x1 - textSize.x - pad.x, y0 + pad.y);
    } else if (type == 3) {
        anchor = vec2(x0 + pad.x, y1 - textSize.y - pad.y);
    } else if (type == 4) {
        anchor = vec2(x1 - textSize.x - pad.x, y1 - textSize.y - pad.y);
    } else if (type == 5) {
        anchor = vec2(center.x - centerGap - textSize.x - pad.x, center.y - textSize.y * 0.5);
    } else if (type == 6) {
        anchor = vec2(center.x + centerGap + pad.x, center.y - textSize.y * 0.5);
    } else if (type == 7) {
        anchor = vec2(center.x - textSize.x * 0.5, center.y - centerGap - textSize.y - pad.y);
    } else if (type == 8) {
        anchor = vec2(center.x - textSize.x * 0.5, center.y + centerGap + pad.y);
    } else {
        anchor = vec2(x0 + pad.x, y0 + pad.y);
    }

    return vec2(
        clamp(anchor.x, 2.0, max(2.0, iResolution.x - textSize.x - 2.0)),
        clamp(anchor.y, 2.0, max(2.0, iResolution.y - textSize.y - 2.0))
    );
}

float trackBoxMaskAt(vec2 fragCoord) {
    int selectedBoxType = int(floor(boxType + 0.5));
    if (selectedBoxType <= 0) return 0.0;

    ivec2 dataSize = textureSize(iChannel2, 0);
    int trackDataRow = max(dataSize.y - 2, 0);
    vec2 as = analysisDims();
    float analysisW = as.x;
    float analysisH = as.y;
    float denomX = max(analysisW - 1.0, 1.0);
    float denomY = max(analysisH - 1.0, 1.0);

    for (int i = 0; i < MAX_TRACKS; i++) {
        vec4 row0 = texelFetch(iChannel2, ivec2(i, trackDataRow), 0);
        vec4 row1 = texelFetch(iChannel2, ivec2(i, trackDataRow + 1), 0);
        if (row1.a < 0.5) continue;

        float minX = row0.r * denomX;
        float minY = row0.g * denomY;
        float maxX = row0.b * denomX;
        float maxY = row0.a * denomY;

        float x0 = minX / analysisW * iResolution.x;
        float x1 = (maxX + 1.0) / analysisW * iResolution.x;
        float y0 = minY / analysisH * iResolution.y;
        float y1 = (maxY + 1.0) / analysisH * iResolution.y;

        if ((selectedBoxType == 1 || selectedBoxType == 2) &&
            fragCoord.x >= x0 && fragCoord.x <= x1 &&
            fragCoord.y >= y0 && fragCoord.y <= y1) {
            return 1.0;
        }

        if (selectedBoxType == 3) {
            vec2 center = vec2((x0 + x1) * 0.5, (y0 + y1) * 0.5);
            float radius = max(x1 - x0, y1 - y0) * 0.5;
            if (length(fragCoord - center) <= radius) return 1.0;
        }
    }

    return 0.0;
}


vec4 trackOverlayAt(vec2 fragCoord, vec3 baseRgb, float baseAlpha) {
    vec3 outRgb = baseRgb;
    ivec2 dataSize = textureSize(iChannel2, 0);
    int trackDataRow = max(dataSize.y - 2, 0);
    vec2 as = analysisDims();
    float analysisW = as.x;
    float analysisH = as.y;
    float denomX = max(analysisW - 1.0, 1.0);
    float denomY = max(analysisH - 1.0, 1.0);

    int selectedLineType = int(floor(lineType + 0.5));
    int selectedLineStyle = int(floor(lineStyle + 0.5));
    int selectedBoxType = int(floor(boxType + 0.5));
    int selectedCenterType = int(floor(centerType + 0.5));
    int selectedCaptionType = int(floor(captionType + 0.5));
    float labelSize = max(captionSize, 1.0);
    vec2 textSize = vec2(labelSize * (0.48 * 7.0 + 0.72), labelSize);
    vec2 captionPad = vec2(2.0, 1.0);

    if (selectedLineType > 0) {
        vec2  pts[MAX_TRACKS];
        vec3  cols[MAX_TRACKS];
        int n = 0;
        for (int i = 0; i < MAX_TRACKS; i++) {
            vec4 row0 = texelFetch(iChannel2, ivec2(i, trackDataRow), 0);
            vec4 row1 = texelFetch(iChannel2, ivec2(i, trackDataRow + 1), 0);
            if (row1.a < 0.5) continue;

            float minX = row0.r * denomX;
            float minY = row0.g * denomY;
            float maxX = row0.b * denomX;
            float maxY = row0.a * denomY;
            float x0p = minX / analysisW * iResolution.x;
            float x1p = (maxX + 1.0) / analysisW * iResolution.x;
            float y0p = minY / analysisH * iResolution.y;
            float y1p = (maxY + 1.0) / analysisH * iResolution.y;
            pts[n]  = vec2((x0p + x1p) * 0.5, (y0p + y1p) * 0.5);
            cols[n] = trackColor(row1.b);
            n++;
        }

        float sideSign = 1.0;
        for (int i = 0; i < MAX_TRACKS - 1; i++) {
            if (i + 1 >= n) break;
            vec2 a  = pts[i];
            vec2 b  = pts[i + 1];
            vec3 ca = cols[i];
            vec3 cb = cols[i + 1];

            float lineA;
            if (selectedLineType == 2) {
                vec2 mid = (a + b) * 0.5;
                vec2 ab = b - a;
                vec2 perp = vec2(-ab.y, ab.x);
                float segLen = length(ab);
                vec2 perpDir = segLen > 1e-3 ? perp / segLen : vec2(0.0, 1.0);
                float arch = clamp(segLen * 0.25, 16.0, 80.0);
                vec2 ctrl = mid + perpDir * arch * sideSign;
                lineA = lineAlphaQuad(fragCoord, a, ctrl, b, selectedLineStyle);
            } else if (selectedLineType == 3) {
                vec2 p0 = (i == 0)         ? (2.0 * a - b) : pts[i - 1];
                vec2 p3 = (i + 2 >= n)     ? (2.0 * b - a) : pts[i + 2];
                vec2 c1 = a + (b  - p0) / 3.0;
                vec2 c2 = b - (p3 - a)  / 3.0;
                lineA = lineAlphaCubic(fragCoord, a, c1, c2, b, selectedLineStyle);
            } else {
                lineA = lineAlphaStraight(fragCoord, a, b, selectedLineStyle);
            }

            if (lineA > 0.001) {
                vec3 segCol = mix(ca, cb, 0.5);
                float aBlend = LINE_OPACITY * lineA;
                outRgb = outRgb * (1.0 - aBlend) + segCol * aBlend;
            }
            sideSign = -sideSign;
        }
    }

    for (int i = 0; i < MAX_TRACKS; i++) {
        vec4 row0 = texelFetch(iChannel2, ivec2(i, trackDataRow), 0);
        vec4 row1 = texelFetch(iChannel2, ivec2(i, trackDataRow + 1), 0);
        if (row1.a < 0.5) continue;

        float minX = row0.r * denomX;
        float minY = row0.g * denomY;
        float maxX = row0.b * denomX;
        float maxY = row0.a * denomY;
        vec3 tcol = trackColor(row1.b);

        float x0 = minX / analysisW * iResolution.x;
        float x1 = (maxX + 1.0) / analysisW * iResolution.x;
        float y0 = minY / analysisH * iResolution.y;
        float y1 = (maxY + 1.0) / analysisH * iResolution.y;

        float fx = fragCoord.x;
        float fy = fragCoord.y;

        float shapeA = boxShapeAlpha(vec2(fx, fy), vec4(x0, y0, x1, y1), selectedBoxType);

        float cxp = (x0 + x1) * 0.5;
        float cyp = (y0 + y1) * 0.5;
        float centA = centerMarkerAlpha(vec2(fx, fy), vec2(cxp, cyp), selectedCenterType, centerSize);

        float layerA = max(shapeA, centA);
        if (layerA >= 0.001) {
            vec3 layerRgb = tcol;
            outRgb = outRgb * (1.0 - layerA) + layerRgb * layerA;
        }

        if (selectedCaptionType > 0) {
            vec2 labelAnchor = captionAnchor(selectedCaptionType, vec4(x0, y0, x1, y1), textSize, captionPad);
            int centerX = int(row1.r * denomX + 0.5);
            int centerY = int(row1.g * denomY + 0.5);
            float bgA = captionBgMask(fragCoord, labelAnchor, labelSize) * captionBgOpacity;
            float textA = captionTextMask(fragCoord, labelAnchor, centerX, centerY, labelSize);
            vec3 textRgb = mix(vec3(1.0), vec3(0.0), step(0.65, luminance(tcol)));

            outRgb = outRgb * (1.0 - bgA) + tcol * bgA;
            outRgb = outRgb * (1.0 - textA) + textRgb * textA;
        }
    }

    return vec4(outRgb, baseAlpha);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord.xy / iResolution.xy;

    vec4 src = texture(iChannel7, uv);

    if (debugMask == 1) {
        fragColor = vec4(vec3(displayDetectionMask(uv)), src.a);
        return;
    }

    int selectedBoxBlend = int(floor(float(boxBlendMode) + 0.5));
    float boxMask = 0.0;
    if (selectedBoxBlend != 0) {
        boxMask = trackBoxMaskAt(fragCoord);
    }
    vec3 baseRgb = src.rgb;
    if (selectedBoxBlend == 1) {
        baseRgb = src.rgb * boxMask;
    } else if (selectedBoxBlend == 2 && boxMask > 0.5) {
        baseRgb = 1.0 - src.rgb;
    }

    vec4 ov = trackOverlayAt(fragCoord, baseRgb, src.a);
    fragColor = vec4(ov.rgb, src.a);
}
