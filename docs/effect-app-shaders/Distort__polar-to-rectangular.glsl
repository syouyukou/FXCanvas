



// @gips_version=1 @coord=rel @filter=on

const vec2 offset = vec2(0.0, 0.0);
const vec2 texScale = vec2(1.0, 1.0);

uniform vec2 center;      // min=-2, max=2
uniform float angle;       // max=360, step=1, desc=rotation
uniform float radius;      // value=1, max=3
uniform float distortion;  // min=-1

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
    pos.x *= min(1.0, iResolution.y / iResolution.x);
    pos.y *= min(1.0, iResolution.x / iResolution.y);
    pos = (pos * 0.5) + 0.5;
    float a = (pos.x - 0.25) * 6.28318530717959 + radians(angle);
    float d = radius * pow(1.0 - pos.y, exp(-distortion));
    return pixel(center + d * vec2(cos(a), sin(a)));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = toRelCoord(fragCoord);
    fragColor = run(uv);
}
