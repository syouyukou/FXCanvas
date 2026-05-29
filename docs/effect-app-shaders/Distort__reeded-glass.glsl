// @animated



const vec2 offset   = vec2(0.0, 0.0);
const vec2 texScale = vec2(1.0, 1.0);
const float PI      = 3.14159265359;




uniform float amount;          // label=amount, value=1.0, min=0.0, max=10.0, step=0.01

uniform float dispersion;      // label=dispersion, value=0.3, min=0.0, max=0.5, step=0.001

uniform float fresnelStrength; // label=reflection, value=0.0, min=0.0, max=1.0, step=0.01
uniform float reflectionScale; // label=reflection scale, value=1.0, min=0.1, max=2.0, step=0.05


uniform float patternMode;     // label=pattern type, value=0.0, min=0.0, max=3.0, step=1.0, desc=0=sine 1=triangle 2=dots 3=honeycomb
uniform float gridRepeats;     // label=pattern repeats, value=7.0, min=1.0, max=64.0, step=1.0
uniform float gridAngle;       // label=pattern angle, value=0.0, min=0.0, max=360.0, step=1.0
uniform float gridContrast;    // label=pattern contrast, value=4.0, min=0.1, max=5.0, step=0.05


uniform float shiftSpeed;      // label=shift speed, value=1.0, min=0.0, max=2.0, step=0.1
uniform float shiftLoop;       // label=shift loop (sec), value=5.0, min=0.0, max=10.0, step=0.5, desc=loop period - one cycle completes per period


uniform float imperfectionsBlend; // label=imperfections, value=0.3, min=0.0, max=1.0, step=0.01
uniform float imperfectionsScale; // label=imperfections scale, value=10.0, min=0.2, max=25.0, step=0.1




vec2 toRelCoord(vec2 coords) {
    float aspect = iResolution.x / iResolution.y;
    vec2 increaseLongSide = aspect > 1.0
        ? vec2(aspect, 1.0)
        : vec2(1.0, 1.0 / aspect);
    return ((coords / iResolution.xy) * 2.0 - 1.0) * increaseLongSide;
}

vec2 fromRelCoord(vec2 coords) {
    float aspect = iResolution.x / iResolution.y;
    vec2 increaseLongSide = aspect > 1.0
        ? vec2(aspect, 1.0)
        : vec2(1.0, 1.0 / aspect);
    return ((coords / increaseLongSide) + 1.0) / 2.0;
}

vec4 sampleTexture(vec2 uv) {
    uv = offset + uv * texScale;
    return textureLod(iChannel0, uv, 0.0);
}


float safeInv(float x) {
    return 1.0 / ((abs(x) > 1e-6) ? x : (x >= 0.0 ? 1e-6 : -1e-6));
}


vec3 Bg(vec2 uv) {
    
    uv = abs(uv);
    uv = uv - 2.0 * floor(uv * 0.5);
    uv = vec2(uv.x > 1.0 ? 2.0 - uv.x : uv.x,
              uv.y > 1.0 ? 2.0 - uv.y : uv.y);
    return sampleTexture(uv).rgb;
}






float getShiftOffset() {
    if (shiftSpeed <= 0.0 && shiftLoop <= 0.0) return 0.0;
    
    if (shiftLoop > 0.0) {
        
        
        
        float patternUnit = 1.0 / max(gridRepeats, 1.0);
        float cycles = (iTime / shiftLoop) * max(shiftSpeed, 0.001);
        return fract(cycles) * patternUnit;
    }
    
    
    return fract(iTime * shiftSpeed);
}


float patternSine(float x) {
    float s = sin(x * 2.0 * PI);
    float a = pow(abs(s), gridContrast);
    return a * sign(s) * 0.5 + 0.5;
}


float patternTriangle(float x) {
    float s = abs(fract(x) * 2.0 - 1.0) * 2.0 - 1.0;  
    float a = pow(abs(s), gridContrast);
    return a * sign(s) * 0.5 + 0.5;
}


float patternDotGrid(vec2 p) {
    float scale = gridRepeats;
    p *= scale;
    
    
    vec2 s = vec2(1.0, 1.732);  
    vec2 a = mod(p, s) * 2.0 - s;
    vec2 b = mod(p + s * 0.5, s) * 2.0 - s;
    
    
    float d2 = min(dot(a, a), dot(b, b));
    
    
    float bump = 1.0 - smoothstep(0.0, 0.8, d2);
    bump = pow(bump, gridContrast);
    
    return bump;
}


float patternHoneycomb(vec2 p) {
    float scale = gridRepeats;
    p *= scale;
    
    
    
    
    
    
    
    
    
    
    const vec2 s = vec2(1.0, 1.73205);  

    vec2 a = mod(p, s) * 2.0 - s;
    vec2 b = mod(p + s * 0.5, s) * 2.0 - s;

    float d2 = min(dot(a, a), dot(b, b));

    
    float v = 0.5 * d2;
    v = clamp(v * 1.5, 0.0, 1.0);

    
    v = pow(v, max(gridContrast, 1e-6));

    return v;
}


float glassGridPattern01(vec2 uv) {
    vec2 p = uv - 0.5;

    
    
    float ar = iResolution.x / max(iResolution.y, 1.0);
    p.x *= ar;

    
    float angleRad = gridAngle * PI / 180.0;
    float ca = cos(angleRad);
    float sa = sin(angleRad);
    mat2 rot = mat2(ca, -sa, sa, ca);
    p = rot * p;

    
    float shiftAmount = getShiftOffset();
    p.x += shiftAmount;

    
    float result;
    
    if (patternMode < 0.5) {
        
        result = patternSine(p.x * gridRepeats);
    } else if (patternMode < 1.5) {
        
        result = patternTriangle(p.x * gridRepeats);
    } else if (patternMode < 2.5) {
        
        result = patternDotGrid(p + 0.5);
    } else {
        
        result = patternHoneycomb(p + 0.5);
    }

    return result;
}



float sampleImperfections(vec2 uv) {
    
    vec2 p = uv - 0.5;
    
    
    
    float ar = iResolution.x / max(iResolution.y, 1.0);
    p.x *= ar;
    
    
    float angleRad = gridAngle * PI / 180.0;
    float ca = cos(angleRad);
    float sa = sin(angleRad);
    mat2 rot = mat2(ca, -sa, sa, ca);
    p = rot * p;
    
    
    float shiftAmount = getShiftOffset();
    p.x += shiftAmount;
    
    
    vec2 scaledUV = p * imperfectionsScale;
    
    
    scaledUV = fract(scaledUV);
    
    
    vec3 imperfectionsColor = texture(iChannel5, scaledUV).rgb;
    
    
    float imperfections = dot(imperfectionsColor, vec3(0.299, 0.587, 0.114));
    
    return imperfections;
}




float linearDodgeBlend(float base, float blend) {
    return clamp(base + blend, 0.0, 1.0);
}




float Height(vec2 uv) {
    float h01 = glassGridPattern01(uv);
    
    
    if (imperfectionsBlend > 0.0) {
        float imperfections = sampleImperfections(uv);
        float blended = linearDodgeBlend(h01, imperfections);
        h01 = mix(h01, blended, imperfectionsBlend);
    }
    
    float heightScale = amount * 0.06;
    return h01 * heightScale;
}

vec3 heightNormal(vec2 uv) {
    float normalStrength = 2.0 + amount * 2.0;
    vec2 texel = vec2(1.0) / iResolution.xy * normalStrength;

    float hC = Height(uv);
    float hX = Height(uv + vec2(texel.x, 0.0));
    float hY = Height(uv + vec2(0.0, texel.y));

    float dx = (hX - hC);
    float dy = (hY - hC);

    vec3 N = normalize(vec3(-dx, -dy, 1.0));
    return N;
}




float fresnelSchlick(float cosTheta, float F0) {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}




vec4 run(vec2 pos) {
    vec2 uv = fromRelCoord(pos);

    
    const float baseIOR = 1.2;

    
    vec3 V = normalize(vec3(0.0, 0.0, -1.0));
    vec3 N = heightNormal(uv);

    
    float iorG = baseIOR;
    float iorR = baseIOR - dispersion;
    float iorB = baseIOR + dispersion;

    vec3 I = -V;

    float etaR = safeInv(iorR);
    float etaG = safeInv(iorG);
    float etaB = safeInv(iorB);

    vec3 Rdir = refract(I, N, etaR);
    vec3 Gdir = refract(I, N, etaG);
    vec3 Bdir = refract(I, N, etaB);

    
    float glassThickness = amount * 1.0;

    float invZ_R = (abs(Rdir.z) > 1e-4) ? (glassThickness / Rdir.z) : 0.0;
    float invZ_G = (abs(Gdir.z) > 1e-4) ? (glassThickness / Gdir.z) : 0.0;
    float invZ_B = (abs(Bdir.z) > 1e-4) ? (glassThickness / Bdir.z) : 0.0;

    vec2 uvR = uv + Rdir.xy * invZ_R;
    vec2 uvG = uv + Gdir.xy * invZ_G;
    vec2 uvB = uv + Bdir.xy * invZ_B;

    
    float r = Bg(uvR).r;
    float g = Bg(uvG).g;
    float b = Bg(uvB).b;

    vec3 refractedColor = vec3(r, g, b);

    
    vec3 reflectDir = reflect(I, N);

    
    float reflectDist = reflectionScale * glassThickness;
    float invZ_Refl = (abs(reflectDir.z) > 1e-4) ? (reflectDist / abs(reflectDir.z)) : reflectDist;
    vec2 uvReflect = uv + reflectDir.xy * invZ_Refl;

    vec3 reflectedColor = Bg(uvReflect);

    
    float eta = baseIOR;
    float F0 = pow((eta - 1.0) / (eta + 1.0), 2.0);
    float cosTheta = clamp(dot(N, -I), 0.0, 1.0);
    float F = fresnelSchlick(cosTheta, F0) * fresnelStrength;

    
    vec3 finalColor = mix(refractedColor, reflectedColor, F);

    return vec4(finalColor, 1.0);
}




void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 pos = toRelCoord(fragCoord);
    fragColor = run(pos);
}

