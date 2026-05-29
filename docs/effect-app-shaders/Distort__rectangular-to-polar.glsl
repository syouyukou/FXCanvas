



// @gips_version=1 @coord=rel @filter=on

const vec2 offset = vec2(0.0, 0.0);
const vec2 texScale = vec2(1.0, 1.0);

uniform vec2 center;      // min=-2, max=2
uniform float angle;       // max=360, step=1, desc=rotation
uniform float radius;      // value=1.5, value=1, max=3
uniform float distortion;  // value=0.2, min=-1
uniform float overlap;     // max=0.5

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
    float d = 1.0 - pow(length(pos) / radius, exp(distortion));
    float a = fract(0.5 + (((abs(pos.x) > abs(pos.y)) ? (1.5707963267949 - atan(pos.x, pos.y)) : atan(pos.y, pos.x)) + 4.71238898038469 - radians(angle)) / 6.28318530717959);

    
    a = a * (1.0 - overlap) + 0.5 * overlap;
    vec4 color = textureLod(iChannel0, vec2(a, d), 0.0);
    if (a < overlap) {
        color = mix(color, textureLod(iChannel0, vec2(a + 1.0 - overlap, d), 0.0), smoothstep(0.0, 1.0, 1.0 - a / overlap));
    } else if (a > (1.0 - overlap)) {
        color = mix(color, textureLod(iChannel0, vec2(a - 1.0 + overlap, d), 0.0), smoothstep(0.0, 1.0, 1.0 - (1.0 - a) / overlap));
    }

    return color;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = toRelCoord(fragCoord);
    fragColor = run(uv);
}
