



// @gips_version=1

uniform vec3 mixR;    // label=(Red from Red, Red from Green, Red from Blue), value=(-0.5, 1.6, 0.33), min=-2, max=2, desc=red mix
uniform vec3 mixG;    // label=(Green from Red, Green from Green, Green from Blue), value=(-0.75, -1.4, 1.8), min=-2, max=2, desc=green mix
uniform vec3 mixB;    // label=(Blue from Red, Blue from Green, Blue from Blue), value=(0.8, -1.0, 1.), min=-2, max=2, desc=blue mix
uniform vec3 offset;  // label=(Red Offset, Green Offset, Blue Offset), value=(1.35, 1.3, -0.2), min=-2, max=2, desc=RGB offset

vec3 run(vec3 rgb) {
    rgb = vec3(dot(rgb, mixR), dot(rgb, mixG), dot(rgb, mixB));
    return rgb + offset;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec4 tex = texture(iChannel0, uv);

    vec3 rgb = (tex.a < 0.01) ? tex.rgb : run(tex.rgb);
    fragColor = vec4(rgb, tex.a);
}
