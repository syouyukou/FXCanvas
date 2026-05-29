



// @gips_version=1 @coords=rel @filter=on

const vec2 offset = vec2(0.0, 0.0);
const vec2 texScale = vec2(1.0, 1.0);

uniform float logScale;     // label=pixel size, value=2.82, max=10, desc=scale (logarithmic)
uniform float gap;          // value=0., max=.2, desc=gap size
uniform float blur;         // label=pixel blur, value=.6, max=5, desc=gap blur
uniform float ledMode;      // label=RGB mode, value=1, ui=switch, desc=RGB subpixel mode
uniform float transparent;  // ui=switch

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

float genMask(vec2 pos, vec2 dscale) {
    float r = fwidth(pos.x * dscale.x) * blur;
    pos = fract(pos) * dscale;
    pos = min(pos, vec2(1.0) - pos) / dscale;
    return smoothstep(-r, r, min(pos.x, pos.y) - gap);
}

vec4 run(vec2 pos) {
    float scale = exp(logScale);
    pos *= scale;

    vec4 color = pixel((floor(pos) + vec2(0.5)) / scale);

    vec4 mask;
    if (ledMode < 0.5) {
        mask.rgb = vec3(genMask(pos, vec2(1.0)));
    } else {
        mask.rgb = vec3(genMask(pos + vec2(0.0/3.0, 0.0), vec2(3.0, 1.0)),
                        genMask(pos + vec2(1.0/3.0, 0.0), vec2(3.0, 1.0)),
                        genMask(pos + vec2(2.0/3.0, 0.0), vec2(3.0, 1.0)));
    }
    mask.a = max(max(mask.r, mask.g), mask.b);

    if (transparent < 0.5) {
        return vec4(color.rgb * mask.rgb, mix(1.0, color.a, mask.a));
    } else {
        return vec4(color.rgb * (mask.rgb / mask.a), color.a * mask.a);
    }
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = toRelCoord(fragCoord);
    fragColor = run(uv);
}
