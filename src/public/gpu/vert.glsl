#version 300 es

// original license
/*
 * Copyright (c) 2018, Adam <Adam@sigterm.info>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
 
#define TILE_SIZE 128

#define FOG_SCENE_EDGE_MIN ((-expandedMapLoadingChunks * 8 + 1) * TILE_SIZE)
#define FOG_SCENE_EDGE_MAX ((104 + expandedMapLoadingChunks * 8 - 1) * TILE_SIZE)
#define FOG_CORNER_ROUNDING 1.5
#define FOG_CORNER_ROUNDING_SQUARED (FOG_CORNER_ROUNDING * FOG_CORNER_ROUNDING)

layout(location = 0) in ivec4 VertexPosition;
layout(location = 1) in vec4 uv;

layout(std140) uniform uniforms {
  int cameraYaw;
  int cameraPitch;
  int centerX;
  int centerY;
  int zoom;
  int cameraX;
  int cameraY;
  int cameraZ;
  ivec2 sinCosTable[2048];
};

uniform float brightness;
uniform int useFog;
uniform int fogDepth;
uniform int drawDistance;
uniform int expandedMapLoadingChunks;
uniform mat4 projectionMatrix;

//out ivec3 fVertex;
out vec4 fColor;
out float fHsl;
//flat out int fTextureId;
//out vec3 fTexPos;
out float fFogAmount;
out vec4 fUv;

//#include "hsl_to_rgb.glsl"
vec3 hslToRgb(int hsl) {
  int var5 = hsl / 128;
  float var6 = float(var5 >> 3) / 64.0f + 0.0078125f;
  float var8 = float(var5 & 7) / 8.0f + 0.0625f;

  int var10 = hsl % 128;

  float var11 = float(var10) / 128.0f;
  float var13 = var11;
  float var15 = var11;
  float var17 = var11;

  if (var8 != 0.0f) {
    float var19;
    if (var11 < 0.5f) {
      var19 = var11 * (1.0f + var8);
    } else {
      var19 = var11 + var8 - var11 * var8;
    }

    float var21 = 2.0f * var11 - var19;
    float var23 = var6 + 0.3333333333333333f;
    if (var23 > 1.0f) {
      var23 -= 1.f;
    }

    float var27 = var6 - 0.3333333333333333f;
    if (var27 < 0.0f) {
      var27 += 1.f;
    }

    if (6.0f * var23 < 1.0f) {
      var13 = var21 + (var19 - var21) * 6.0f * var23;
    } else if (2.0f * var23 < 1.0f) {
      var13 = var19;
    } else if (3.0f * var23 < 2.0f) {
      var13 = var21 + (var19 - var21) * (0.6666666666666666f - var23) * 6.0f;
    } else {
      var13 = var21;
    }

    if (6.0f * var6 < 1.0f) {
      var15 = var21 + (var19 - var21) * 6.0f * var6;
    } else if (2.0f * var6 < 1.0f) {
      var15 = var19;
    } else if (3.0f * var6 < 2.0f) {
      var15 = var21 + (var19 - var21) * (0.6666666666666666f - var6) * 6.0f;
    } else {
      var15 = var21;
    }

    if (6.0f * var27 < 1.0f) {
      var17 = var21 + (var19 - var21) * 6.0f * var27;
    } else if (2.0f * var27 < 1.0f) {
      var17 = var19;
    } else if (3.0f * var27 < 2.0f) {
      var17 = var21 + (var19 - var21) * (0.6666666666666666f - var27) * 6.0f;
    } else {
      var17 = var21;
    }
  }

  vec3 rgb = vec3(pow(var13, brightness), pow(var15, brightness), pow(var17, brightness));

  return rgb;
}

float fogFactorLinear(const float dist, const float start, const float end) {
  return 1.0 - clamp((dist - start) / (end - start), 0.0, 1.0);
}

void main() {
  /*ivec3 vertex = VertexPosition.xyz;
  int ahsl = VertexPosition.w;
  int hsl = ahsl & 0xffff;
  float a = float(ahsl >> 24 & 0xff) / 255.f;

  vec3 rgb = hslToRgb(hsl);

  //fVertex = vertex;

  fColor = vec4(rgb, 1.f - a);
  fHsl = float(hsl);

  //fTextureId = int(uv.x);  // the texture id + 1;
  //fTexPos = uv.yzw;
  fUv = uv;

  // the client draws one less tile to the north and east than it does to the south
  // and west, so subtract a tiles width from the north and east edges.
  int fogWest = max(FOG_SCENE_EDGE_MIN, int(cameraX) - drawDistance);
  int fogEast = min(FOG_SCENE_EDGE_MAX, int(cameraX) + drawDistance - TILE_SIZE);
  int fogSouth = max(FOG_SCENE_EDGE_MIN, int(cameraZ) - drawDistance);
  int fogNorth = min(FOG_SCENE_EDGE_MAX, int(cameraZ) + drawDistance - TILE_SIZE);

  // Calculate distance from the scene edge
  float xDist = min(float(VertexPosition.x - fogWest), float(fogEast - VertexPosition.x));
  float zDist = min(float(VertexPosition.z - fogSouth), float(fogNorth - VertexPosition.z));
  float nearestEdgeDistance = min(xDist, zDist);
  float secondNearestEdgeDistance = max(xDist, zDist);
  float fogDistance =
      nearestEdgeDistance - FOG_CORNER_ROUNDING * float(TILE_SIZE) *
                                max(0.f, (nearestEdgeDistance + FOG_CORNER_ROUNDING_SQUARED) / 
                                  (secondNearestEdgeDistance + FOG_CORNER_ROUNDING_SQUARED));

  fFogAmount = fogFactorLinear(fogDistance, 0.f, float(fogDepth) * float(TILE_SIZE)) * float(useFog);*/

  ivec3 vertex = VertexPosition.xyz;
  int ahsl = VertexPosition.w;
  int hsl = ahsl & 0xffff;
  float a = float(ahsl >> 24 & 0xff) / 255.f;

  vec3 rgb = hslToRgb(hsl);

  fColor = vec4(rgb, 1.f - a);
  fHsl = float(hsl);
  fUv = uv;

  int fogWest = max(FOG_SCENE_EDGE_MIN, cameraX - drawDistance);
  int fogEast = min(FOG_SCENE_EDGE_MAX, cameraX + drawDistance - TILE_SIZE);
  int fogSouth = max(FOG_SCENE_EDGE_MIN, cameraZ - drawDistance);
  int fogNorth = min(FOG_SCENE_EDGE_MAX, cameraZ + drawDistance - TILE_SIZE);

  // Calculate distance from the scene edge
  int fogDistance = min(min(vertex.x - fogWest, fogEast - vertex.x), min(vertex.z - fogSouth, fogNorth - vertex.z));

  fFogAmount = fogFactorLinear(float(fogDistance), 0.f, float(fogDepth * TILE_SIZE)) * float(useFog);
  
  vec4 pos = projectionMatrix * vec4(vertex, 1);
  gl_Position = pos;

}