










uniform int   charSet;          // value=0, min=0, max=4, step=1
uniform float gridDensity;      // label=density, value=60.0, min=14.0, max=70.0, step=1.0
uniform float tileAspectRatio;  // label=tile aspect, value=0.6, min=0.55, max=1.5, step=0.01
uniform vec3  charColor;        // label=character color, ui=color, value=(1.0, 1.0, 1.0), random=0
uniform vec3  bgColor;          // label=background color, ui=color, value=(0.0, 0.0, 0.0), random=0
uniform float invert;           // ui=switch
uniform float contrast;         // value=1.0, min=0.0, max=3.0, step=0.01
uniform float cutDarks;         // label=cut darks, value=0.02, min=0.0, max=0.5, step=0.01, desc=dark area → space
uniform float cutLights;        // label=cut lights, value=0.0, min=0.0, max=0.5, step=0.01, desc=bright area → max glyph
uniform float overlayOnImage;   // label=overlay on image, value=0, ui=switch




const vec2 MEGA_ATLAS_SIZE = vec2(1024.0, 880.0);
const int CHARSET_COUNT = 5;








const vec2 CHARSET_ORIGIN_PX[CHARSET_COUNT] = vec2[](
    vec2(0.0, 0.0),
    vec2(0.0, 80.0),
    vec2(0.0, 640.0),
    vec2(0.0, 720.0),
    vec2(0.0, 800.0)
);

const vec2 CHARSET_GRID[CHARSET_COUNT] = vec2[](
    vec2(16.0, 1.0),
    vec2(16.0, 7.0),
    vec2(16.0, 1.0),
    vec2(16.0, 1.0),
    vec2(16.0, 1.0)
);

const vec2 CHARSET_CELL_PX[CHARSET_COUNT] = vec2[](
    vec2(64.0, 80.0),
    vec2(64.0, 80.0),
    vec2(64.0, 80.0),
    vec2(64.0, 80.0),
    vec2(64.0, 80.0)
);

const int CHARSET_GLYPH_COUNT[CHARSET_COUNT] = int[](
    9, 98, 8, 4, 6
);

const float CHARSET_MSDF_PIXEL_RANGE[CHARSET_COUNT] = float[](
    2.000, 2.000, 2.000, 2.000, 2.000
);




const vec2  ATLAS_SIZE          = MEGA_ATLAS_SIZE;   
const float GLYPH_SCALE_IN_CELL = 0.9;               
const float CELL_PAD_PX         = 1.0;               




float luma(vec3 c) {
    return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

float median3(vec3 v) {
    return max(min(v.x, v.y), min(max(v.x, v.y), v.z));
}


float adjustBrightness(float b) {
    b = clamp(b, 0.0, 1.0);

    
    if (invert > 0.5) {
        b = 1.0 - b;
    }

    
    float c = max(contrast, 0.001);
    b = pow(b, c);

    return b;
}


void getCharsetParams(
    int csIndex,
    out vec2 originPx,
    out vec2 grid,
    out vec2 cellSize,
    out int  glyphCount,
    out float msdfRange
) {
    if (csIndex >= 0 && csIndex < CHARSET_COUNT) {
        originPx   = CHARSET_ORIGIN_PX[csIndex];
        grid       = CHARSET_GRID[csIndex];
        cellSize   = CHARSET_CELL_PX[csIndex];
        glyphCount = CHARSET_GLYPH_COUNT[csIndex];
        msdfRange  = CHARSET_MSDF_PIXEL_RANGE[csIndex];
    } else {
        
        originPx   = vec2(0.0);
        grid       = vec2(16.0, 1.0);
        cellSize   = vec2(64.0, 80.0);
        glyphCount = 0;
        msdfRange  = 2.0;
    }
}

int charsetGlyphCount(int csIndex) {
    vec2 o, g, c;
    int count;
    float r;
    getCharsetParams(csIndex, o, g, c, count, r);
    return count;
}


float sampleMSDF(vec2 uv, float msdfRange) {
    vec3 msdfTex = texture2D(iChannel5, uv).rgb;
    float sd     = median3(msdfTex) - 0.5;

    
    vec2 duv = fwidth(uv);
    float screenPxRange = max(0.5 * dot(duv * ATLAS_SIZE, vec2(1.0)), 1.0);

    float pxDist = sd * msdfRange * screenPxRange;
    return clamp(pxDist + 0.5, 0.0, 1.0);
}


vec2 getGlyphBaseUV(int csIndex, int glyphIndex) {
    vec2 originPx, grid, cellSize;
    int  glyphCount;
    float msdfRange;
    getCharsetParams(csIndex, originPx, grid, cellSize, glyphCount, msdfRange);

    if (glyphIndex < 0 || glyphIndex >= glyphCount) {
        return vec2(0.0);
    }

    int cols = int(grid.x);
    int col  = glyphIndex % cols;
    int row  = glyphIndex / cols;

    vec2 cellOriginPx = originPx + vec2(float(col) * cellSize.x,
                                        float(row) * cellSize.y);

    return cellOriginPx / ATLAS_SIZE;
}






float getCharGlyph(int csIndex, int glyphIndex, vec2 localUV, vec2 cellSizePx) {
    vec2 originPx, grid, cellSize;
    int  glyphCount;
    float msdfRange;
    getCharsetParams(csIndex, originPx, grid, cellSize, glyphCount, msdfRange);

    if (glyphIndex < 0 || glyphIndex >= glyphCount) {
        return 0.0;
    }

    
    vec2 posPx = (localUV - 0.5) * cellSizePx;

    float hGlyphPx    = cellSizePx.y * GLYPH_SCALE_IN_CELL;
    float glyphAspect = cellSize.x / cellSize.y; 
    float wGlyphPx    = hGlyphPx * glyphAspect;

    vec2 glyphUV = posPx / vec2(wGlyphPx, hGlyphPx) + 0.5;

    if (glyphUV.x < 0.0 || glyphUV.x > 1.0 || glyphUV.y < 0.0 || glyphUV.y > 1.0) {
        return 0.0;
    }

    
    vec2 baseUV = getGlyphBaseUV(csIndex, glyphIndex);

    vec2 padPx       = vec2(CELL_PAD_PX);
    vec2 padUV       = padPx / ATLAS_SIZE;
    vec2 innerSizeUV = (cellSize - 2.0 * padPx) / ATLAS_SIZE;

    vec2 atlasUV = baseUV + padUV + glyphUV * innerSizeUV;

    float glyphValue = sampleMSDF(atlasUV, msdfRange);

    
    float tileAspect = cellSizePx.x / cellSizePx.y;
    float cropFactor = clamp(tileAspect / glyphAspect, 0.0, 1.0);

    float xCentered = localUV.x - 0.5;
    float halfCrop  = 0.5 * cropFactor;

    float cropMask = step(-halfCrop, xCentered) * step(xCentered, halfCrop);

    return glyphValue * cropMask;
}



int pickGlyphIndex(int csIndex, float brightnessRaw) {
    
    float b = adjustBrightness(brightnessRaw); 

    int glyphCount = charsetGlyphCount(csIndex);
    if (glyphCount <= 0) return -1;

    float darkCut = clamp(cutDarks, 0.0, 0.99);
    float lightCut = clamp(cutLights, 0.0, 0.99);
    float hi = max(1.0 - lightCut, darkCut + 0.001);

    
    
    if (b < darkCut) {
        
        return glyphCount;
    }

    
    if (b > hi) {
        
        return glyphCount;
    }

    
    float t = (b - darkCut) / (hi - darkCut);
    t = clamp(t, 0.0, 1.0);

    int idx = int(t * float(glyphCount - 1) + 0.5);
    return idx;
}




void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    int csIndex = clamp(charSet, 0, 4);

    
    float effectiveDensity = max(gridDensity, 1.0); 
    float screenAspect     = iResolution.x / iResolution.y;
    float safeTileAspect   = max(tileAspectRatio, 0.0001);

    vec2 terminalSize;
    terminalSize.y = effectiveDensity;
    terminalSize.x = effectiveDensity * screenAspect / safeTileAspect;

    vec2 terminalPos = uv * terminalSize;
    vec2 cellIndex   = floor(terminalPos);
    vec2 localUV     = fract(terminalPos);

    vec2 cellSizePx = vec2(
        iResolution.x / terminalSize.x,
        iResolution.y / terminalSize.y
    );

    
    vec2 cellCenterUV = (cellIndex + 0.5) / terminalSize;
    vec3 srcColorTile = texture2D(iChannel0, cellCenterUV).rgb;
    vec3 tileColor    = srcColorTile;
    float brightness  = luma(tileColor); 

    int   glyphIndex  = pickGlyphIndex(csIndex, brightness);
    float glyphMask   = getCharGlyph(csIndex, glyphIndex, localUV, cellSizePx);

    vec3 baseBg = bgColor;
    vec3 srcColor = texture2D(iChannel0, uv).rgb;
    float overlayMix = step(0.5, overlayOnImage);
    vec3 baseColor = mix(baseBg, srcColor, overlayMix);
    vec3 finalColor = mix(baseColor, charColor, glyphMask);

    fragColor = vec4(finalColor, 1.0);
}
