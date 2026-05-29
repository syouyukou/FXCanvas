



// @gips_version=1

uniform float red;      // value=0.4, min=-1, desc=cyan<->red
uniform float green;      // value=-0.7, min=-1, desc=magenta<->green
uniform float blue;      // value=-1, min=-1, desc=yellow<->blue
uniform float keep_luma;  // value=0, ui=switch, desc=preserve luminance
uniform float gamma;     // value=2, min=.2, max=5, desc=working gamma

vec3 run(vec3 rgb) {
    rgb = pow(rgb, vec3(gamma));
    float luma = dot(rgb, vec3(.25, .5, .25));
    rgb.r *= 1.0 + red;
    rgb.g *= 1.0 + green;
    rgb.b *= 1.0 + blue;
    if (keep_luma > 0.5) {
        rgb *= luma / dot(rgb, vec3(.25, .5, .25));
    }
    return pow(rgb, vec3(1.0 / gamma));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec4 tex = texture(iChannel0, uv);

    vec3 rgb = (tex.a < 0.01) ? tex.rgb : run(tex.rgb);
    fragColor = vec4(rgb, tex.a);
}
