// @animated




precision mediump float;
precision mediump sampler2D;



const float BACK_FLIP_X = 0.0;  
const float BACK_FLIP_Y = 0.0;  




const float ATLAS_SIZE_PX = 864.0;

const float TILE_SIZE_PX = 128.0;

const float TILE_PADDING_PX = 8.0;

const float DEFAULT_INSET_PX = 2.0;


uniform float scale;      // value=4, min=0, max=10, step=0.1

uniform int matcapIndex;         // label=color, value=30, min=0, max=35, step=1, desc=atlas tile index (0..3)

uniform vec2 uPose;       // label=light direction, value=(0.0,0.0), min=-3.14,-1.57, max=3.14,1.57, step=0.01,0.01, desc=base rotation angles in radians (yaw, pitch)
uniform vec2 uSpin;       // label=light animation, value=(0.0,0.0), min=-1,-1, max=1,1, step=0.01,0.01, desc=angular velocity in radians/sec (trackball axis from XY)
uniform vec2 shadowVector;       // label=shadow direction, value=(3.0,3.0), min=-20,-20, max=20,20, step=0.5,0.5, desc=shadow direction (xy) and distance=|vec| in pixels
uniform float lockShadowToRotation; // label=lock shadow, ui=switch, desc=lock shadow vector to rotation
uniform float shadowStrength;    // label=shadow intensity, value=0.5, min=0, max=2, step=0.1, desc=shadow casting intensity from raised areas
uniform float shadowBlur;        // label=shadow blur, value=0.0, min=0, max=10, step=0.5, desc=shadow blur radius in pixels (0 disables blur)
uniform float highlightStrength; // label=highlight intensity, value=0.3, min=0, max=2, step=0.1, desc=highlight intensity on opposite side of shadows
uniform float highlightDistance; // label=highlight distance, value=2.0, min=0, max=20, step=0.5, desc=highlight distance in pixels (separate from shadowVector)
uniform float gradientStrength;  // label=gradient strength, value=0.2, min=0, max=1, step=0.01, desc=overlay gradient strength from light direction
uniform float depthDarkening;    // label=depth darkening, value=0.3, min=0, max=1, step=0.01, desc=uniform darkening based on surface depth









const float debugMode = 0.0;



highp float getHeight(vec2 uv) {
    vec3 color = texture(iChannel0, uv).rgb;
    
    
    return dot(color, vec3(0.299, 0.587, 0.114));
}


vec3 getSyntheticNormal(vec2 uv) {
    
    vec2 centered = (uv - 0.5) * 2.0; 
    float r = length(centered);

    if(r > 1.0) {
        
        return vec3(0.0, 0.0, 1.0);
    }

    
    float z = sqrt(1.0 - r * r);
    return normalize(vec3(centered.x, centered.y, z));
}


vec3 getNormal(vec2 uv) {
    vec2 texelSize = 1.0 / vec2(textureSize(iChannel0, 0));

    
    highp float tl = getHeight(uv + vec2(-texelSize.x, -texelSize.y));   
    highp float tm = getHeight(uv + vec2(0.0, -texelSize.y));           
    highp float tr = getHeight(uv + vec2(texelSize.x, -texelSize.y));   
    highp float ml = getHeight(uv + vec2(-texelSize.x, 0.0));           
    highp float mr = getHeight(uv + vec2(texelSize.x, 0.0));            
    highp float bl = getHeight(uv + vec2(-texelSize.x, texelSize.y));   
    highp float bm = getHeight(uv + vec2(0.0, texelSize.y));            
    highp float br = getHeight(uv + vec2(texelSize.x, texelSize.y));    

    
    float sobelX = (-1.0 * tl) + (0.0 * tm) + (1.0 * tr) +
        (-2.0 * ml) + (0.0 * 0.0) + (2.0 * mr) +
        (-1.0 * bl) + (0.0 * bm) + (1.0 * br);

    
    float sobelY = (-1.0 * tl) + (-2.0 * tm) + (-1.0 * tr) +
        (0.0 * ml) + (0.0 * 0.0) + (0.0 * mr) +
        (1.0 * bl) + (2.0 * bm) + (1.0 * br);

    
    float dx = sobelX * scale;
    float dy = sobelY * scale;

    
    vec3 n = normalize(vec3(-dx, -dy, 1.0));

    
    n.xy = -n.xy;  

    return n;
}



mat3 rotationMatrixY(float a) {
    float c = cos(a), s = sin(a);
    return mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c);
}

mat3 rotationMatrixX(float a) {
    float c = cos(a), s = sin(a);
    return mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c);
}


mat3 rotAxisAngle(vec3 axis, float angle) {
    vec3 a = normalize(axis);
    float c = cos(angle), s = sin(angle), ic = 1.0 - c;
    return mat3(c + a.x * a.x * ic, a.x * a.y * ic - a.z * s, a.x * a.z * ic + a.y * s, a.y * a.x * ic + a.z * s, c + a.y * a.y * ic, a.y * a.z * ic - a.x * s, a.z * a.x * ic - a.y * s, a.z * a.y * ic + a.x * s, c + a.z * a.z * ic);
}



mat3 buildTrackballRotation(vec2 pose, vec2 spin, float time) {
    
    
    highp float t = time;
    highp float speed = length(spin);         
    mat3 Rspin = mat3(1.0);
    if(speed > 1e-6) {
        
        
        vec3 axis = normalize(vec3(-spin.y, spin.x, 0.0)); 
        highp float angle = speed * t;                      
        Rspin = rotAxisAngle(axis, angle);
    }

    
    float yaw = pose.x;                              
    float pitch = -pose.y;
    mat3 Rpose = rotationMatrixY(yaw) * rotationMatrixX(pitch);

    
    return Rpose * Rspin;
}

vec3 applyTrackballToNormal(mat3 R, vec3 n) {
    return normalize(R * n);
}

vec2 applyTrackballToVec2(mat3 R, vec2 v) {
    vec3 r = R * vec3(v, 0.0);
    return r.xy;
}




float getShadows(vec2 uv, vec2 effectiveShadowVector) {
    if(shadowStrength <= 0.0)
        return 1.0; 

    vec2 texelSize = 1.0 / iResolution.xy;
    float currentHeight = getHeight(uv);

    
    vec2 sv = effectiveShadowVector;

    float rayLenPx = length(sv);
    if(rayLenPx <= 0.0)
        return 1.0;

    
    vec2 shadowRayDir = -normalize(sv);
    vec2 shadowPerp = vec2(-shadowRayDir.y, shadowRayDir.x);

    float maxShadow = 0.0;
    float steps = 5.0; 

    
    for(float step = 1.0; step <= steps; step += 1.0) {
        float stepDistance = (step / steps) * rayLenPx;
        vec2 basePos = uv + shadowRayDir * stepDistance * texelSize;

        
        if(basePos.x < 0.0 || basePos.x > 1.0 || basePos.y < 0.0 || basePos.y > 1.0) {
            break;
        }

        
        float blurPx = max(shadowBlur, 0.0);
        vec2 offsetA = basePos + shadowPerp * (-blurPx) * texelSize;
        vec2 offsetB = basePos;
        vec2 offsetC = basePos + shadowPerp * (blurPx) * texelSize;

        
        offsetA = clamp(offsetA, vec2(0.0), vec2(1.0));
        offsetB = clamp(offsetB, vec2(0.0), vec2(1.0));
        offsetC = clamp(offsetC, vec2(0.0), vec2(1.0));

        float hA = getHeight(offsetA);
        float hB = getHeight(offsetB);
        float hC = getHeight(offsetC);

        float wA = 0.25;
        float wB = 0.50;
        float wC = 0.25;

        
        
        float iA = max(hA - currentHeight, 0.0);
        float iB = max(hB - currentHeight, 0.0);
        float iC = max(hC - currentHeight, 0.0);

        float blendedIntensity = (iA * wA + iB * wB + iC * wC);
        
        blendedIntensity *= (1.0 - (step - 1.0) / steps);

        maxShadow = max(maxShadow, blendedIntensity);
    }

    
    float shadowFactor = 1.0 - (maxShadow * shadowStrength);

    
    return clamp(shadowFactor, 0.2, 1.0); 
}


float getHighlights(vec2 uv, vec2 effectiveShadowVector) {
    if(highlightStrength <= 0.0 || highlightDistance <= 0.0)
        return 1.0; 

    vec2 texelSize = 1.0 / iResolution.xy;
    float currentHeight = getHeight(uv);

    
    
    vec2 sv = effectiveShadowVector;

    
    vec2 shadowRayDir = -normalize(sv);

    
    vec2 highlightRayDir = -shadowRayDir;
    vec2 highlightPerp = vec2(-highlightRayDir.y, highlightRayDir.x);

    float rayLenPx = highlightDistance;
    float maxHighlight = 0.0;
    float steps = 5.0; 

    
    for(float step = 1.0; step <= steps; step += 1.0) {
        float stepDistance = (step / steps) * rayLenPx;
        vec2 basePos = uv + highlightRayDir * stepDistance * texelSize;

        
        if(basePos.x < 0.0 || basePos.x > 1.0 || basePos.y < 0.0 || basePos.y > 1.0) {
            break;
        }

        
        float blurPx = max(shadowBlur, 0.0); 
        vec2 offsetA = basePos + highlightPerp * (-blurPx) * texelSize;
        vec2 offsetB = basePos;
        vec2 offsetC = basePos + highlightPerp * (blurPx) * texelSize;

        
        offsetA = clamp(offsetA, vec2(0.0), vec2(1.0));
        offsetB = clamp(offsetB, vec2(0.0), vec2(1.0));
        offsetC = clamp(offsetC, vec2(0.0), vec2(1.0));

        float hA = getHeight(offsetA);
        float hB = getHeight(offsetB);
        float hC = getHeight(offsetC);

        float wA = 0.25;
        float wB = 0.50;
        float wC = 0.25;

        
        
        float iA = max(hA - currentHeight, 0.0);
        float iB = max(hB - currentHeight, 0.0);
        float iC = max(hC - currentHeight, 0.0);

        float blendedIntensity = (iA * wA + iB * wB + iC * wC);
        
        blendedIntensity *= (1.0 - (step - 1.0) / steps);

        maxHighlight = max(maxHighlight, blendedIntensity);
    }

    
    float highlightFactor = 1.0 + (maxHighlight * highlightStrength);

    
    return clamp(highlightFactor, 1.0, 3.0); 
}



float getDepthDarkening(vec2 uv) {
    if(depthDarkening <= 0.0)
        return 1.0; 

    float height = getHeight(uv);

    
    float recess = clamp((0.5 - height) * 2.0, 0.0, 1.0);

    float darkening = 1.0 - (recess * depthDarkening);
    return clamp(darkening, 0.2, 1.0); 
}


vec3 overlayBlend(vec3 base, vec3 blend) {
    return vec3((base.r < 0.5) ? (2.0 * base.r * blend.r) : (1.0 - 2.0 * (1.0 - base.r) * (1.0 - blend.r)), (base.g < 0.5) ? (2.0 * base.g * blend.g) : (1.0 - 2.0 * (1.0 - base.g) * (1.0 - blend.g)), (base.b < 0.5) ? (2.0 * base.b * blend.b) : (1.0 - 2.0 * (1.0 - base.b) * (1.0 - blend.b)));
}


vec3 sampleMatcapAtlasLinear(vec2 uv) {
    
    float stridePx = TILE_SIZE_PX + 2.0 * TILE_PADDING_PX; 
    int columns = max(1, int(floor(ATLAS_SIZE_PX / stridePx + 1e-4)));
    int rows = max(1, int(floor(ATLAS_SIZE_PX / stridePx + 1e-4)));
    int tileCount = max(1, columns * rows);

    
    int idx = matcapIndex;
    if(tileCount > 0) {
        idx = idx % tileCount;
        if(idx < 0) {
            idx += tileCount;
        }
    }

    
    int col = columns > 0 ? (idx % columns) : 0;
    int row = columns > 0 ? (idx / columns) : 0;

    
    vec2 tileOriginPx = vec2(TILE_PADDING_PX + float(col) * stridePx, TILE_PADDING_PX + float(row) * stridePx);

    
    float safetyInsetPx = DEFAULT_INSET_PX;

    
    vec2 tileStartUV = (tileOriginPx + safetyInsetPx) / ATLAS_SIZE_PX;
    vec2 tileSizeUV = vec2(TILE_SIZE_PX - 2.0 * safetyInsetPx) / ATLAS_SIZE_PX;

    
    vec2 atlasUV = tileStartUV + uv * tileSizeUV;

    
    vec3 srgb = texture(iChannel5, atlasUV).rgb;
    return pow(srgb, vec3(2.2));
}


vec3 getGradientOverlay(vec2 uv, vec3 baseColor, vec2 effectiveShadowVector) {
    if(gradientStrength <= 0.0)
        return baseColor; 

    
    vec2 lightDir = effectiveShadowVector;

    
    vec2 normalizedLightDir = normalize(lightDir);

    
    
    vec2 centerToUV = uv - vec2(0.5);
    float gradientProgress = dot(centerToUV, normalizedLightDir) + 0.5;
    gradientProgress = clamp(gradientProgress, 0.0, 1.0);

    
    
    float grayValue = mix(0.25, 0.75, gradientProgress); 
    vec3 gradientColor = vec3(grayValue);

    
    vec3 overlayResult = overlayBlend(baseColor, gradientColor);

    
    return mix(baseColor, overlayResult, gradientStrength);
}


vec2 projectNormalToMatcap(vec3 normal, out bool isBackFacing, out float edgeBlend) {
    
    isBackFacing = normal.z < 0.0;
    vec3 projNormal = normal;

    
    edgeBlend = smoothstep(-0.1, 0.1, abs(normal.z));

    
    if(isBackFacing) {
        projNormal.z = -projNormal.z;
    }
    projNormal = normalize(projNormal);

    
    vec2 matcapUV = projNormal.xy * 0.5 + 0.5;

    
    if(isBackFacing) {
        if(BACK_FLIP_X > 0.5) {
            matcapUV.x = 1.0 - matcapUV.x;
        }
        if(BACK_FLIP_Y > 0.5) {
            matcapUV.y = 1.0 - matcapUV.y;
        }
    }

    return matcapUV;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    

    
    if(debugMode >= 5.5) {
        float height = getHeight(uv);
        fragColor = vec4(vec3(height), 1.0);
        return;
    }

    
    if(debugMode >= 4.5) {
        
        mat3 R = buildTrackballRotation(uPose, uSpin, iTime);
        vec3 normal = getSyntheticNormal(uv);
        vec3 tiltedNormal = applyTrackballToNormal(R, normal);

        bool isBackFacing;
        float edgeBlend;
        vec2 matcapUV = projectNormalToMatcap(tiltedNormal, isBackFacing, edgeBlend);

        
        float inSphere = length((uv - 0.5) * 2.0) <= 1.0 ? 1.0 : 0.0;
        fragColor = vec4(matcapUV, inSphere, 1.0);
        return;
    }

    
    if(debugMode >= 3.5) {
        vec3 inputColor = texture(iChannel0, uv).rgb;
        fragColor = vec4(inputColor, 1.0);
        return;
    }

    
    if(debugMode >= 2.5) {
        vec3 normal = getNormal(uv);
        mat3 R = buildTrackballRotation(uPose, uSpin, iTime);
        vec3 rotatedNormal = applyTrackballToNormal(R, normal);

        
        vec3 normalColor = rotatedNormal * 0.5 + 0.5;
        fragColor = vec4(normalColor, 1.0);
        return;
    }

    
    if(debugMode >= 1.5) {
        vec3 rawAtlas = texture(iChannel5, uv).rgb;
        fragColor = vec4(rawAtlas, 1.0);
        return;
    }

    
    if(debugMode >= 0.5) {
        
        mat3 R = buildTrackballRotation(uPose, uSpin, iTime);

        
        vec3 normal = getSyntheticNormal(uv);

        
        vec3 tiltedNormal = applyTrackballToNormal(R, normal);

        
        bool isBackFacing;
        float edgeBlend;
        vec2 matcapUV = projectNormalToMatcap(tiltedNormal, isBackFacing, edgeBlend);

        
        matcapUV = clamp(matcapUV, vec2(0.002), vec2(0.998));

        
        vec3 matcapLinear = sampleMatcapAtlasLinear(matcapUV);

        
        vec3 colorSRGB = pow(matcapLinear, vec3(1.0 / 2.2));
        fragColor = vec4(clamp(colorSRGB, 0.0, 1.0), 1.0);
        return;
    }

    

    
    mat3 R = buildTrackballRotation(uPose, uSpin, iTime);

    
    vec2 effectiveShadowVector = lockShadowToRotation > 0.5 ? applyTrackballToVec2(R, shadowVector) : shadowVector;

    
    vec3 normal = getNormal(uv);

    
    vec3 tiltedNormal = applyTrackballToNormal(R, normal);

    
    bool isBackFacing;
    float edgeBlend;
    vec2 matcapUV = projectNormalToMatcap(tiltedNormal, isBackFacing, edgeBlend);

    
    matcapUV = clamp(matcapUV, vec2(0.002), vec2(0.998));

    
    vec3 matcapLinear = sampleMatcapAtlasLinear(matcapUV);

    
    float shadowFactor = getShadows(uv, effectiveShadowVector);

    
    float highlightFactor = getHighlights(uv, effectiveShadowVector);

    
    float depthFactor = getDepthDarkening(uv);

    
    
    float combinedDarkening = shadowFactor * depthFactor;

    
    
    vec3 colorWithDarkening = matcapLinear * combinedDarkening;
    vec3 colorWithHighlights = colorWithDarkening * highlightFactor;

    
    vec3 colorLinear = getGradientOverlay(uv, colorWithHighlights, effectiveShadowVector);

    
    vec3 colorSRGB = pow(colorLinear, vec3(1.0 / 2.2));

    
    fragColor = vec4(clamp(colorSRGB, 0.0, 1.0), 1.0);
}
