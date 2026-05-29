



// @gips_version=1

uniform vec3 start_color;  // value=(0.90196, 0.19608, 0.09020), ui=color, desc=lower color
uniform vec3 end_color;  // value=(0.9569, 0.7137, 0.2588), ui=color, desc=upper color
uniform vec3 gamma;   //  label=(red gamma, green gamma, blue gamma), value=(1.0, 1.0, 1.0), min=.3, max=3

vec3 run(vec3 c) {
    return mix(start_color, end_color, pow(c, gamma));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec4 tex = texture(iChannel0, uv);

    vec3 rgb = (tex.a < 0.01) ? tex.rgb : run(tex.rgb);
    fragColor = vec4(rgb, tex.a);
}
