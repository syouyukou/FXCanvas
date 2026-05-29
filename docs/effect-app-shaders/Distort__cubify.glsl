// @animated




// @gips_version=1 @coord=rel @filter=on

const vec2 offset = vec2(0.0, 0.0);
const vec2 texScale = vec2(1.0, 1.0);

uniform float scale;         // label=cube size, value=1.1, max=8, desc=scale (logarithmic)
uniform float aspect;        // label=cube stretch, min=-1
uniform float strength;      // label=depth distortion, value=1.8, max=5
uniform float hard;          // label=hard edges, ui=switch, desc=hard pixels
uniform float angle;         // label=rotation angle, max=90, step=1
uniform vec2 phase;         // label=position offset, min=-1
uniform vec2 animateSpeed;  // label=animation speed, value=(0.1, 0.), min=-5, max=5, desc=speed of animation



const float baseIOR = 1.2;
uniform float dispersion;    // label=dispersion, value=0.0, min=0.0, max=1.0, step=0.001

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

vec2 distort(vec2 pos, float strengthVal) {
    
    float s = sin(radians(angle)), c = cos(radians(angle));
    pos *= mat2(c,s,-s,c);
    vec2 scxy = vec2(exp(scale + aspect), exp(scale - aspect));
    vec2 deltaPhase = animateSpeed * iTime;
    pos = (pos * scxy) + (phase + deltaPhase);
    vec2 base = floor(pos);
    pos -= base;

    
    if (hard > 0.5) {
        pos = step(0.5, pos);
    } else {
        float m = strengthVal;
        while (m > 1.0) {
            pos = smoothstep(0.0, 1.0, pos);
            m -= 1.0;
        }
        pos = mix(pos, smoothstep(0.0, 1.0, pos), m);
    }

    
    pos = (pos + base - (phase + deltaPhase)) / scxy;
    pos *= mat2(c,-s,s,c);
    return pos;
}

vec4 run(vec2 pos) {
    
    float denom = (abs(baseIOR) > 1e-6) ? baseIOR : (baseIOR >= 0.0 ? 1e-6 : -1e-6);
    float iorG = baseIOR;
    float iorR = baseIOR - dispersion;
    float iorB = baseIOR + dispersion;

    float sG = strength * (iorG / denom);
    float sR = strength * (iorR / denom);
    float sB = strength * (iorB / denom);

    vec4 colR = pixel(distort(pos, sR));
    vec4 colG = pixel(distort(pos, sG));
    vec4 colB = pixel(distort(pos, sB));

    return vec4(colR.r, colG.g, colB.b, colG.a);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = toRelCoord(fragCoord);
    fragColor = run(uv);
}
