



// @gips_version=1

uniform vec3 downmix;               // label=(red weight, green weight, blue weight), value=(.683, 1.155, .199), min=-1, max=2, step=0.001, desc=RGB weights
uniform float normalize_weights;     // value=1, ui=switch, desc=normalize weights
uniform vec3 tint_color;            // value=(1.0, 1.0, 1.0), ui=color

vec3 run(vec3 rgb) {
    vec3 w = downmix;
    if (normalize_weights > 0.5) { w /= w.x + w.y + w.z; }
    return pow(vec3(clamp(dot(rgb, w), 0.0, 1.0)), 2.0 - tint_color);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec4 tex = texture(iChannel0, uv);

    vec3 rgb = (tex.a < 0.01) ? tex.rgb : run(tex.rgb);
    fragColor = vec4(rgb, tex.a);
}
