



// @gips_version=1

uniform vec3 midpoint;  // label=(red midpoint, green midpoint, blue midpoint), value=(0.0, 0.0, 0.0),
uniform vec3 gain;      // label=(red gain, green gain, blue gain), value=(1.0, 1.0, 1.0), max=5
uniform vec3 gamma;     // label=(red gamma, green gamma, blue gamma), value=(1.0, 1.0, 1.0), min=.2, max=5

vec3 run(vec3 rgb) {
    rgb = (rgb - midpoint) * gain;
    bvec3 sign = lessThan(rgb, vec3(0.0));
    rgb = pow(abs(rgb), 1.0 / gamma);
    return mix(rgb, -rgb, sign) + midpoint;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec4 tex = texture(iChannel0, uv);

    vec3 rgb = (tex.a < 0.01) ? tex.rgb : run(tex.rgb);
    fragColor = vec4(rgb, tex.a);
}
