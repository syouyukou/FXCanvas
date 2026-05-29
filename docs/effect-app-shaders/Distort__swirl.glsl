



// @gips_version=1 @coord=rel

const vec2 offset = vec2(0.0, 0.0);
const vec2 texScale = vec2(1.0, 1.0);

uniform float strength;   // value=0.66, min=-5, max=5, step=0.01, desc=linear strength
uniform float frequency;  // value=41.4, min=1, max=100, step=0.1
uniform float amplitude;  // max=1.5
uniform float phase;      // max=360, step=1
uniform vec2 center;     // min=-2, max=2

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

vec4 run(vec2 pos) {
    pos -= center;
    float d = length(pos);
    float a = d * strength + amplitude * sin(d * frequency + radians(phase));
    float c = cos(a), s = sin(a);
    return pixel(mat2(c, -s, s, c) * pos + center);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = toRelCoord(fragCoord);
    fragColor = run(uv);
}
