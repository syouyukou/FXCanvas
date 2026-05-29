// @animated



const vec2 offset   = vec2(0.0, 0.0);
const vec2 texScale = vec2(1.0, 1.0);

uniform float gridX;          // label=grid X divisions, value=8, min=1, max=64, step=1
uniform float gridY;          // label=grid Y divisions, value=8, min=1, max=64, step=1
uniform vec2  dotPos;         // label=dot position, value=(0.,0.), min=-1, max=1, desc=relative coords
uniform float amp;            // label=stretch amount, value=-0.7, min=-1.00, max=1.00
uniform float radius;         // label=effect radius, value=0.5, min=0.01, max=1.0

uniform float noiseScale;     // label=noise size, value=4.0, min=0.1, max=32.0
uniform float noiseSpeed;     // label=noise speed, value=0.5, min=0.2, max=5.0
uniform float pointNoiseMix;  // label=noise blend, value=0.5, min=0.0, max=1.0
uniform float noiseLoop;      // label=noise loop (sec), value=5.0, min=0.0, max=20.0







vec2 toRelCoord(vec2 coords) {
    float aspect = iResolution.x / iResolution.y;
    vec2 increaseLongSide = aspect > 1.0
        ? vec2(aspect, 1.0)
        : vec2(1.0, 1.0 / aspect);
    return ((coords / iResolution.xy) * 2.0 - 1.0) * increaseLongSide;
}

vec2 fromRelCoord(vec2 coords) {
    float aspect = iResolution.x / iResolution.y;
    vec2 increaseLongSide = aspect > 1.0
        ? vec2(aspect, 1.0)
        : vec2(1.0, 1.0 / aspect);
    return ((coords / increaseLongSide) + 1.0) / 2.0;
}

vec4 sampleTexture(vec2 uv) {
    uv = offset + uv * texScale;
    return textureLod(iChannel0, uv, 0.0);
}




float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 345.45));
    p += dot(p, p + 34.345);
    return fract(p.x * p.y);
}

float noise2D(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y); 
}







float axisWeight(float coord, float dotCoord, float amp, float radius, bool isX) {
    
    float dist    = abs(coord - dotCoord);           
    float falloff = smoothstep(0.0, radius, dist);   
    float wPoint  = 1.0 + amp * (1.0 - 2.0 * falloff);
    
    

    
    float baseX   = coord * noiseScale;
    float axisId  = isX ? 0.0 : 10.0;

    float rawT    = iTime * noiseSpeed;
    vec2  p;

    if (noiseLoop > 0.0) {
        
        float tNorm = fract(rawT / noiseLoop);
        float angle = tNorm * 6.28318530718; 

        
        vec2 offsetCirc = vec2(cos(angle), sin(angle));
        p = vec2(baseX, axisId) + offsetCirc;
    } else {
        
        p = vec2(baseX, rawT + axisId);
    }

    float n      = noise2D(p);      
    n            = n * 2.0 - 1.0;   
    float wNoise = 1.0 + amp * n;   

    
    float mix01 = clamp(pointNoiseMix, 0.0, 1.0);
    float w = mix(wPoint, wNoise, mix01);

    return max(w, 0.0001);          
}




float warp1D(float uvCoord, float dotCoord, float tiles, float amp, float radius, bool isX) {
    tiles = max(tiles, 1.0);
    int tileCount = int(tiles);
    const int MAX_TILES = 64;

    
    float tIndexF = floor(uvCoord * tiles);
    tIndexF = clamp(tIndexF, 0.0, tiles - 1.0);
    int   tIndex = int(tIndexF);
    float tLocal = uvCoord * tiles - tIndexF;   

    
    float totalRaw = 0.0;
    for (int i = 0; i < MAX_TILES; i++) {
        if (i >= tileCount) break;
        float center = (float(i) + 0.5) / tiles;
        totalRaw += axisWeight(center, dotCoord, amp, radius, isX);
    }

    
    float prefix = 0.0;
    float cur    = 0.0;
    for (int i = 0; i < MAX_TILES; i++) {
        if (i >= tileCount) break;
        float center = (float(i) + 0.5) / tiles;
        float w      = axisWeight(center, dotCoord, amp, radius, isX);
        if (i < tIndex) prefix += w;
        if (i == tIndex) cur = w;
    }

    
    float uMin   = prefix / totalRaw;
    float uWidth = cur    / totalRaw;

    
    float src = uMin + tLocal * uWidth;
    return clamp(src, 0.0, 1.0);
}




vec2 warpUV(vec2 uv, vec2 dotUv) {
    float srcU = warp1D(uv.x, dotUv.x, gridX, amp, radius, true);
    float srcV = warp1D(uv.y, dotUv.y, gridY, amp, radius, false);
    return vec2(srcU, srcV);
}




vec4 run(vec2 pos) {
    
    vec2 uv = fromRelCoord(pos);

    
    vec2 dotUv = dotPos * 0.5 + 0.5;

    
    vec2 srcUv = warpUV(uv, dotUv);

    
    vec4 col = sampleTexture(srcUv);
    return col;
}




void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 pos = toRelCoord(fragCoord);
    fragColor = run(pos);
}
