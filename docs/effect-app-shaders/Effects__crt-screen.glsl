



// @gips_version=1 @coord=rel @filter=on

const vec2 offset = vec2(0.0, 0.0);
const vec2 texScale = vec2(1.0, 1.0);

uniform float distance;   // value=2, min=1.5, max=10
uniform float curvature;  // value=.2, min=.01, max=.7
uniform float bezel;      // value=.02, desc=bevel width
uniform float vignette;   // value=6, max=10, desc=depth vignetting
uniform vec3 bg;         // ui=color, desc=background color
uniform float bgOpacity;  // value=1, desc=background color opacity

uniform float gridEn;     // label=phosphor dots, value=1, ui=switch, desc=enable shadow mask
uniform float density;    // value=4.5, max=10, desc=grid size
uniform float dotSize;    // label=size, value=.4, max=.5, desc=dot size
uniform float dotSmooth;  // label=dot softness, value=.1, min=.001, max=0.5, desc=dot smoothness
uniform float gamma;      // label=gamma correction, value=2.8, min=0.1, max=10, desc=working gamma
uniform float gain;       // label=brightness gain, value=1, max=10, desc=exposure gain

vec2 toRelCoord(vec2 coords) {
    float aspect = iResolution.x / iResolution.y;
    vec2 increaseLongSide = aspect > 1.0 ? vec2(aspect, 1.0) : vec2(1.0, 1.0 / aspect);
    return ((coords / iResolution.xy) * 2.0 - 1.0) * increaseLongSide;
}

vec2 fromRelCoord(vec2 coords) {
    float aspect = iResolution.x / iResolution.y;
    vec2 increaseLongSide = aspect > 1.0 ? vec2(aspect, 1.0) : vec2(1.0, 1.0 / aspect);
    return ((coords / increaseLongSide) + 1.0) / 2.0;
}

vec4 pixel(in vec2 pos) {
    vec2 uv = fromRelCoord(pos);
    uv = offset + uv * texScale;
    return textureLod(iChannel0, uv, 0.0);
}

float shadowMask(vec2 rpos) {
    return smoothstep(dotSize + dotSmooth, dotSize - dotSmooth,
                      length(mod(rpos, vec2(3.0, 1.732)) - vec2(1.5, 0.866)));
}

vec4 run(vec2 rel) {
    
    
    vec2 target = rel * distance * sin(curvature) / (distance - 1.0);
    vec3 dir = normalize(vec3(target, distance));

    
    float t = dir.z * distance;
    float u = t * t - distance * distance + 1.0;
    if (u < 0.0) { return vec4(bg, bgOpacity); }
    t -= sqrt(u);

    
    vec2 hit = asin(dir.xy * t) / curvature;
    vec4 fg = pixel(hit);

    
    vec2 bevelDist = smoothstep(0.0, bezel, vec2(
        max(1.0, iResolution.x / iResolution.y),
        max(1.0, iResolution.y / iResolution.x)
    ) - abs(hit));
    fg.a *= bevelDist.x * bevelDist.y;

    
    if (vignette > 0.0) {
        fg.rgb *= 1.0 - (1.0 - distance + dir.z * t) * vignette;
    }

    
    if (gridEn > 0.5) {
        vec2 maskPos = hit * exp(density);
        vec3 maskCol = vec3(
            shadowMask(maskPos)                  + shadowMask(maskPos + vec2(1.5, 0.866)),
            shadowMask(maskPos + vec2(1.0, 0.0)) + shadowMask(maskPos + vec2(2.5, 0.866)),
            shadowMask(maskPos + vec2(2.0, 0.0)) + shadowMask(maskPos + vec2(3.5, 0.866))
        );
        fg.rgb = pow(pow(fg.rgb, vec3(gamma)) * gain * maskCol, vec3(1.0 / gamma));
    }

    
    float bga = bgOpacity * (1.0 - fg.a);
    fg.rgb = fg.rgb * fg.a + bg * bga;
    fg.a += bga;
    return vec4(fg.rgb / fg.a, fg.a);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = toRelCoord(fragCoord);
    fragColor = run(uv);
}
