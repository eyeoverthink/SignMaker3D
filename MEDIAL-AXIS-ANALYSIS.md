# Medial Axis Transform (MAT) Analysis
## Understanding the Scott Algorithm's Topological Extraction

**Date:** January 17, 2026  
**Purpose:** Validate that the Scott Algorithm extracts M(Ω) - the Medial Axis Transform

---

## Mathematical Definition

For a bounded open set Ω ⊂ ℝ², the Medial Axis M(Ω) is defined as:

```
M(Ω) = {x ∈ Ω | ∃r > 0 s.t. Bᵣ(x) ⊆ Ω and ∄Bᵣ'(y) ⊆ Ω s.t. Bᵣ(x) ⊂ Bᵣ'(y)}
```

Where:
- Bᵣ(x) is an open disk of radius r centered at x
- M(Ω) is the locus of centers of all maximal inscribed disks

**Key Property:** M(Ω) is homotopy equivalent to Ω - it preserves topology while reducing dimension.

---

## Current Implementation Analysis

### 1. **Image Tracer (`image-tracer.tsx`)**

**What it does:**
```typescript
// Step 1: Sobel Edge Detection
const edges = applySobelEdgeDetection(grayscale, width, height);

// Step 2: Threshold to binary
const binary = applyThreshold(edges, threshold);

// Step 3: Moore-Neighbor Boundary Tracing
const contours = extractContours(binary, width, height);

// Step 4: Douglas-Peucker Simplification
const simplified = simplifyPath(contours, tolerance);
```

**Analysis:**
- **Sobel Edge Detection**: Finds ∂Ω (the boundary), NOT M(Ω)
- **Moore-Neighbor Tracing**: Follows ∂Ω, extracting the outer contour
- **Result**: This extracts the **boundary**, not the **skeleton**

**Verdict:** ❌ **Current implementation does NOT extract M(Ω)**

---

### 2. **What We Actually Need: Skeletonization**

To extract M(Ω), we need one of these algorithms:

#### **Option A: Zhang-Suen Thinning Algorithm**
```
Input: Binary image (foreground/background)
Output: 1-pixel-wide skeleton

Process:
1. Iteratively remove boundary pixels
2. Preserve connectivity (topology)
3. Stop when no more pixels can be removed
4. Result: Medial axis approximation
```

#### **Option B: Distance Transform + Ridge Detection**
```
Input: Binary image
Output: Skeleton as ridge of distance function

Process:
1. Compute distance transform D(x) = distance to nearest boundary
2. Find local maxima of D(x) (ridges)
3. Result: Exact medial axis
```

#### **Option C: Voronoi Diagram of Boundary Points**
```
Input: Boundary points ∂Ω
Output: Voronoi skeleton

Process:
1. Sample boundary points
2. Compute Voronoi diagram
3. Prune external edges
4. Result: Medial axis
```

---

## Test Case: Letter 'A'

### Current Behavior (Boundary Tracing):
```
Input: Thick letter 'A' (outline)
Output: Two contours - outer boundary + inner hole
Result: Double-line paths (not suitable for neon tube)
```

### Desired Behavior (Medial Axis):
```
Input: Thick letter 'A' (outline)
Output: Single centerline skeleton
Result: Single-stroke path (perfect for neon tube)
```

---

## Validation Test Plan

### Test 1: Simple Shape (Circle)
```
Input: Filled circle (radius 50px)
Expected M(Ω): Single point at center
Current Output: Circular boundary contour
Status: FAIL - outputs boundary, not center
```

### Test 2: Thick Line
```
Input: Horizontal rectangle (200x20px)
Expected M(Ω): Horizontal line through center
Current Output: Two parallel lines (top + bottom edges)
Status: FAIL - outputs boundary, not centerline
```

### Test 3: Letter 'I'
```
Input: Thick letter 'I'
Expected M(Ω): Vertical centerline
Current Output: Rectangular outline
Status: FAIL - outputs boundary, not skeleton
```

---

## Conclusion

**Finding:** The current Scott Algorithm implementation performs **boundary tracing** (∂Ω extraction), not **medial axis extraction** (M(Ω)).

**Impact:**
- Preset shapes will have thick outlines instead of centerlines
- Neon tubes will follow the boundary, creating double-wall geometry
- Not suitable for single-stroke paths

**Required Action:**
1. Implement Zhang-Suen skeletonization algorithm
2. Apply to binary image BEFORE boundary tracing
3. Trace the skeleton instead of the boundary
4. Validate that output is homotopy-equivalent to input

---

## Next Steps

1. ✅ **Understand**: Confirmed current algorithm traces ∂Ω, not M(Ω)
2. ⏳ **Test**: Create test images to validate skeletonization
3. ⏳ **Validate**: Compare skeleton output against mathematical definition
4. ⏳ **Implement**: Add Zhang-Suen algorithm to image tracer
5. ⏳ **Deploy**: Use skeletonization for preset shapes extraction

---

## References

- Zhang-Suen Thinning: "A fast parallel algorithm for thinning digital patterns" (1984)
- Medial Axis Transform: Blum, H. (1967) "A transformation for extracting new descriptors of shape"
- Distance Transform: Rosenfeld & Pfaltz (1966)
