// @animated




// @gips_version=1 @coord=rel

const vec2 offset = vec2(0.0, 0.0);
const vec2 texScale = vec2(1.0, 1.0);

uniform float amplitude;     // value=0.035, max=0.2, step=0.001
uniform float frequency;     // value=21.4, value=50, max=200
uniform float phase;         // max=360, step=1
uniform vec2 center;        // min=-2, max=2
uniform float animateSpeed;  // label=animation speed, value=0.8, min=-10, max=10, desc=speed of animation



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

vec2 warp(vec2 pos, float amp) {
    vec2 tp = pos - center;
    float d = length(tp);
    
    vec2 n = (d > 1e-6) ? (tp / d) : vec2(0.0, 0.0);
    d += amp * sin(frequency * d + radians(phase + iTime * animateSpeed * 100.0));
    return n * d + center;
}

vec4 run(vec2 pos) {
    
    float denom = (abs(baseIOR) > 1e-6) ? baseIOR : (baseIOR >= 0.0 ? 1e-6 : -1e-6);
    float iorG = baseIOR;
    float iorR = baseIOR - dispersion;
    float iorB = baseIOR + dispersion;

    float aG = amplitude * (iorG / denom);
    float aR = amplitude * (iorR / denom);
    float aB = amplitude * (iorB / denom);

    vec4 colR = pixel(warp(pos, aR));
    vec4 colG = pixel(warp(pos, aG));
    vec4 colB = pixel(warp(pos, aB));

    return vec4(colR.r, colG.g, colB.b, colG.a);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = toRelCoord(fragCoord);
    fragColor = run(uv);
}
