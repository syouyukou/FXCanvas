
uniform float uPatternType;   //label=Pattern, value=0.0, min=0.0, max=4.0, step=1.0, desc=halftone pattern type (0=dots, 1=squares, 2=diamonds, 3=horizontal lines, 4=cross-hatch)
uniform float uHalftoneFreq; // label=Frequency, value=80.0, min=10.0, max=300.0, step=1.0, desc=halftone dot frequency
uniform float uRoughness;    // label=Roughness, value=0.5, min=0.0, max=1.5, step=0.01, desc=roughness of dot edges (0.0 for perfect circles)
uniform float uFuzziness;    // label=Fuzziness, value=0.1, min=0.0, max=0.5, step=0.01, desc=fuzz range for optical dot gain
uniform float uPaperNoise;   // label=Paper Fiber, value=0.1, min=0.0, max=0.5, step=0.01, desc=amount of noise for paper texture
uniform float uInkNoise;     // label=Ink Texture, value=0.5, min=0.0, max=1.0, step=0.01, desc=amount of noise for ink
uniform float uInkAmount;    // label=Ink Density, value=0.9, min=0.0, max=1.2, step=0.01, desc=ink density
uniform float uCyanAngle;    // label=Cyan Angle, value=15.0, min=0.0, max=90.0, step=1.0, desc=cyan screen angle (degrees)
uniform float uMagentaAngle; // label=Magenta Angle, value=-15.0, min=-90.0, max=90.0, step=1.0, desc=magenta screen angle (degrees)
uniform float uYellowAngle;  // label=Yellow Angle, value=0.0, min=0.0, max=90.0, step=1.0, desc=yellow screen angle (degrees)
uniform float uBlackAngle;   // label=Black Angle, value=45.0, min=0.0, max=90.0, step=1.0, desc=black screen angle (degrees)
uniform float uCyanEnabled;    // label=Cyan, value=1.0, min=0.0, max=1.0, step=1.0, ui=switch, desc=enable cyan channel
uniform float uMagentaEnabled; // label=Magenta, value=1.0, min=0.0, max=1.0, step=1.0, ui=switch, desc=enable magenta channel
uniform float uYellowEnabled;  // label=Yellow, value=1.0, min=0.0, max=1.0, step=1.0, ui=switch, desc=enable yellow channel
uniform float uBlackEnabled;   // label=Black, value=1.0, min=0.0, max=1.0, step=1.0, ui=switch, desc=enable black channel
uniform vec2 uCyanDisplace;    // label=Cyan Shift, value=(0.0, 0.0), min=-0.1, max=0.1, step=0.001, desc=cyan channel displacement
uniform vec2 uMagentaDisplace; // label=Magenta Shift, value=(0.0, 0.0), min=-0.1, max=0.1, step=0.001, desc=magenta channel displacement
uniform vec2 uYellowDisplace;  // label=Yellow Shift, value=(0.0, 0.0), min=-0.1, max=0.1, step=0.001, desc=yellow channel displacement
uniform vec2 uBlackDisplace;   // label=Black Shift, value=(0.0, 0.0), min=-0.1, max=0.1, step=0.001, desc=black channel displacement



float aastep(float threshold, float value) {
  float afwidth = 0.7 * length(vec2(dFdx(value), dFdy(value)));
  return smoothstep(threshold-afwidth, threshold+afwidth, value);
}


float aasmoothstep(float t1, float t2, float v) {
	float aw = 0.7 * length(vec2(dFdx(v), dFdy(v)));
    float t = 0.5*(t1+t2);
	float sw = max(0.5*(t2-t1), aw);
	return smoothstep(t-sw, t+sw, v);
}


vec4 texture2D_bilinear(sampler2D tex, vec2 st) {
    vec2 dims = vec2(textureSize(tex, 0)); 
    vec2 uv = st * dims;
    
    vec2 uv00 = floor(uv + vec2(0.5)); 
    vec2 uvlerp = uv - uv00 + vec2(0.5); 
    vec4 tx00, tx01, tx10, tx11;
    ivec2 ij = ivec2(uv00);
    tx00 = texelFetch(tex, ij, 0);
    tx01 = texelFetchOffset(tex, ij, 0, ivec2(0.0, 1.0));
    tx10 = texelFetchOffset(tex, ij, 0, ivec2(1.0, 0.0));
    tx11 = texelFetchOffset(tex, ij, 0, ivec2(1.0, 1.0));
	vec4 tx0 = mix(tx00, tx01, uvlerp.y);
	vec4 tx1 = mix(tx10, tx11, uvlerp.y);
	return mix(tx0, tx1, uvlerp.x);
}





float psrdnoise(vec2 x, vec2 period, float alpha, out vec2 gradient)
{
	vec2 uv = vec2(x.x+x.y*0.5, x.y);
	vec2 i0 = floor(uv), f0 = fract(uv);
	float cmp = step(f0.y, f0.x);
	vec2 o1 = vec2(cmp, 1.0-cmp);
	vec2 i1 = i0 + o1, i2 = i0 + 1.0;
	vec2 v0 = vec2(i0.x - i0.y*0.5, i0.y);
	vec2 v1 = vec2(v0.x + o1.x - o1.y*0.5, v0.y + o1.y);
	vec2 v2 = vec2(v0.x + 0.5, v0.y + 1.0);
	vec2 x0 = x - v0, x1 = x - v1, x2 = x - v2;
	vec3 iu, iv, xw, yw;
	if(any(greaterThan(period, vec2(0.0)))) {
		xw = vec3(v0.x, v1.x, v2.x);
		yw = vec3(v0.y, v1.y, v2.y);
		if(period.x > 0.0)
			xw = mod(vec3(v0.x, v1.x, v2.x), period.x);
		if(period.y > 0.0)
			yw = mod(vec3(v0.y, v1.y, v2.y), period.y);
		iu = floor(xw + 0.5*yw + 0.5); iv = floor(yw + 0.5);
	} else {
		iu = vec3(i0.x, i1.x, i2.x); iv = vec3(i0.y, i1.y, i2.y);
	}
	vec3 hash = mod(iu, 289.0);
	hash = mod((hash*51.0 + 2.0)*hash + iv, 289.0);
	hash = mod((hash*34.0 + 10.0)*hash, 289.0);
	vec3 psi = hash*0.07482 + alpha;
	vec3 gx = cos(psi); vec3 gy = sin(psi);
	vec2 g0 = vec2(gx.x, gy.x);
	vec2 g1 = vec2(gx.y, gy.y);
	vec2 g2 = vec2(gx.z, gy.z);
	vec3 w = 0.8 - vec3(dot(x0, x0), dot(x1, x1), dot(x2, x2));
	w = max(w, 0.0); vec3 w2 = w*w; vec3 w4 = w2*w2;
	vec3 gdotx = vec3(dot(g0, x0), dot(g1, x1), dot(g2, x2));
	float n = dot(w4, gdotx);
	vec3 w3 = w2*w; vec3 dw = -8.0*w3*gdotx;
	vec2 dn0 = w4.x*g0 + dw.x*x0;
	vec2 dn1 = w4.y*g1 + dw.y*x1;
	vec2 dn2 = w4.z*g2 + dw.z*x2;
	gradient = 10.9*(dn0 + dn1 + dn2);
	return 10.9*n;
}


float calculateDotPattern(vec2 uv, float density, float roughness, float noise, float brightness) {
    float r = sqrt(density) - length(uv) + roughness * noise;
    return r + brightness;
}

float calculateSquarePattern(vec2 uv, float density, float roughness, float noise, float brightness) {
    
    float dist = max(abs(uv.x), abs(uv.y));
    float r = sqrt(density) - dist + roughness * noise;
    return r + brightness;
}

float calculateDiamondPattern(vec2 uv, float density, float roughness, float noise, float brightness) {
    
    float dist = abs(uv.x) + abs(uv.y);
    float r = sqrt(density) * 1.414 - dist + roughness * noise; 
    return r + brightness;
}

float calculateHorizontalLinePattern(vec2 uv, float density, float roughness, float noise, float brightness) {
    
    float dist = abs(uv.y);
    float r = sqrt(density) - dist + roughness * noise;
    return r + brightness;
}

float calculateVerticalLinePattern(vec2 uv, float density, float roughness, float noise, float brightness) {
    
    float dist = abs(uv.x);
    float r = sqrt(density) - dist + roughness * noise;
    return r + brightness;
}

float calculateCrossHatchPattern(vec2 uv, float density, float roughness, float noise, float brightness) {
    
    float horizontal = calculateHorizontalLinePattern(uv, density, roughness, noise, brightness);
    float vertical = calculateVerticalLinePattern(uv, density, roughness, noise, brightness);
    return max(horizontal, vertical);
}


float calculatePattern(float patternType, vec2 uv, float density, float roughness, float noise) {
    if (patternType < 0.5) {
        
        return calculateDotPattern(uv, density, roughness, noise, 0.0);
    } else if (patternType < 1.5) {
        
        return calculateSquarePattern(uv, density, roughness, noise, -0.15);
    } else if (patternType < 2.5) {
        
        return calculateDiamondPattern(uv, density, roughness, noise, 0.0);
    } else if (patternType < 3.5) {
        
        return calculateHorizontalLinePattern(uv, density, roughness, noise, -0.2);
    } else {
        
        return calculateCrossHatchPattern(uv, density, roughness, noise, -0.4);
    }
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 texturesize = vec2(textureSize(iChannel0, 0));
    vec2 st = fragCoord / iResolution.xy;

    
    float aspect = iResolution.x / iResolution.y;
    st.x *= aspect;

    
    vec2 texUV = fragCoord / iResolution.xy;

    
    vec2 cyanUV = texUV + uCyanDisplace;
    vec2 magentaUV = texUV + uMagentaDisplace;
    vec2 yellowUV = texUV + uYellowDisplace;
    vec2 blackUV = texUV + uBlackDisplace;

    
    float cyanValid = step(0.0, cyanUV.x) * step(cyanUV.x, 1.0) * step(0.0, cyanUV.y) * step(cyanUV.y, 1.0);
    float magentaValid = step(0.0, magentaUV.x) * step(magentaUV.x, 1.0) * step(0.0, magentaUV.y) * step(magentaUV.y, 1.0);
    float yellowValid = step(0.0, yellowUV.x) * step(yellowUV.x, 1.0) * step(0.0, yellowUV.y) * step(yellowUV.y, 1.0);
    float blackValid = step(0.0, blackUV.x) * step(blackUV.x, 1.0) * step(0.0, blackUV.y) * step(blackUV.y, 1.0);

    vec3 cyanColor = texture2D_bilinear(iChannel0, cyanUV).rgb;
    vec3 magentaColor = texture2D_bilinear(iChannel0, magentaUV).rgb;
    vec3 yellowColor = texture2D_bilinear(iChannel0, yellowUV).rgb;
    vec3 blackColor = texture2D_bilinear(iChannel0, blackUV).rgb;

    vec2 p, g, gtemp;
	float n, s, f, w; 
	p = vec2(0.0);
	s = 100.0; 
	w = 0.5;

    
    for(int i=0; i<6; i++) { 
	  f += w*psrdnoise(s*vec2(2.0,1.0)*st, p, 0.0, gtemp);
	  g += w*gtemp;
	  w *= 0.55;
	  s *= 2.2;
	}
    n = 0.1*f+0.15*length(g);

    float freq = uHalftoneFreq;  
    float rough = uRoughness;  
    float fuzz = uFuzziness;   

    float papernoise = uPaperNoise; 
    float inknoise = uInkNoise;   
    vec3 papercolor = vec3(1.0, 1.0, 1.0); 

    vec3 paper = papercolor - papernoise * n; 
    float inkamount = uInkAmount - inknoise * n; 

    
    vec4 cyanCMYK = vec4(1.0 - cyanColor, min(min(1.0 - cyanColor.r, 1.0 - cyanColor.g), 1.0 - cyanColor.b));
    cyanCMYK.xyz -= cyanCMYK.w;

    vec4 magentaCMYK = vec4(1.0 - magentaColor, min(min(1.0 - magentaColor.r, 1.0 - magentaColor.g), 1.0 - magentaColor.b));
    magentaCMYK.xyz -= magentaCMYK.w;

    vec4 yellowCMYK = vec4(1.0 - yellowColor, min(min(1.0 - yellowColor.r, 1.0 - yellowColor.g), 1.0 - yellowColor.b));
    yellowCMYK.xyz -= yellowCMYK.w;

    vec4 blackCMYK = vec4(1.0 - blackColor, min(min(1.0 - blackColor.r, 1.0 - blackColor.g), 1.0 - blackColor.b));
    blackCMYK.xyz -= blackCMYK.w;

    
    

    
    float cyanRad = radians(uCyanAngle);
    float magentaRad = radians(uMagentaAngle);
    float yellowRad = radians(uYellowAngle);
    float blackRad = radians(uBlackAngle);

    
    mat2 cyanRot = mat2(cos(cyanRad), -sin(cyanRad), sin(cyanRad), cos(cyanRad));
    mat2 magentaRot = mat2(cos(magentaRad), -sin(magentaRad), sin(magentaRad), cos(magentaRad));
    mat2 yellowRot = mat2(cos(yellowRad), -sin(yellowRad), sin(yellowRad), cos(yellowRad));
    mat2 blackRot = mat2(cos(blackRad), -sin(blackRad), sin(blackRad), cos(blackRad));

    
    vec2 Kst_displaced = st + uBlackDisplace * aspect;
    vec2 Kst = freq * blackRot * Kst_displaced;
    vec2 Kuv = 2.0*fract(Kst)-1.0;
    float Kr = calculatePattern(uPatternType, Kuv, blackCMYK.w, rough, n);
    float k = uBlackEnabled * blackValid * (1.0-(1.0-aasmoothstep(-fuzz, 0.0, Kr)) * (1.0-aastep(0.0, Kr)));
    
    vec2 Cst_displaced = st + uCyanDisplace * aspect;
    vec2 Cst = freq * cyanRot * Cst_displaced;
    vec2 Cuv = 2.0*fract(Cst)-1.0;
    float Cr = calculatePattern(uPatternType, Cuv, cyanCMYK.x, rough, n);
    float c = uCyanEnabled * cyanValid * (1.0-(1.0-aasmoothstep(-fuzz, 0.0, Cr)) * (1.0-aastep(0.0, Cr)));
    
    vec2 Mst_displaced = st + uMagentaDisplace * aspect;
    vec2 Mst = freq * magentaRot * Mst_displaced;
    vec2 Muv = 2.0*fract(Mst)-1.0;
    float Mr = calculatePattern(uPatternType, Muv, magentaCMYK.y, rough, n);
    float m = uMagentaEnabled * magentaValid * (1.0-(1.0-aasmoothstep(-fuzz, 0.0, Mr)) * (1.0-aastep(0.0, Mr)));
    
    vec2 Yst_displaced = st + uYellowDisplace * aspect;
    vec2 Yst = freq * yellowRot * Yst_displaced;
    vec2 Yuv = 2.0*fract(Yst)-1.0;
    float Yr = calculatePattern(uPatternType, Yuv, yellowCMYK.z, rough, n);
    float y = uYellowEnabled * yellowValid * (1.0-(1.0-aasmoothstep(-fuzz, 0.0, Yr)) * (1.0-aastep(0.0, Yr)));

    
    vec3 rgbscreen = (1.0-inkamount*vec3(c,m,y));
    
    rgbscreen = mix(paper*rgbscreen, vec3(0.0), inkamount*k);
    
    
    
    vec3 originalTexcolor = texture2D_bilinear(iChannel0, texUV).rgb;
    float afwidth = 2.0 * freq * max(length(dFdx(st)), length(dFdy(st)));
    float blend = smoothstep(0.7, 1.4, afwidth);

    fragColor = vec4(mix(rgbscreen, originalTexcolor, blend), 1.0);
}
