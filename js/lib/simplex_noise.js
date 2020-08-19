"use strict";

function openSimplexNoise(clientSeed) {
	const SQ5 = 2.23606797749979;
	const SQ4 = 2;
	const SQ3 = 1.7320508075688772;
	const toNums = (s) => s.split(",").map(s => new Uint8Array(s.split("").map(v => Number(v))));
	const decode = (m, r, s) => new Int8Array(s.split("").map(v => parseInt(v, r) + m));
	const toNumsB32 = (s) => s.split(",").map(s => parseInt(s, 32));
	const NORM_2D = 1.0 / 47.0;
	const SQUISH_2D = (SQ3 - 1) / 2;
	const STRETCH_2D = (1 / SQ3 - 1) / 2;
	let base2D = toNums("110101000,110101211");
	const gradients2D = decode(-5, 11, "a77a073aa3700330");
	let lookupPairs2D = () => new Uint8Array([0,1, 1,0, 4,1, 17,0, 20,2, 21,2, 22,5, 23, 5,26, 4,39, 3,42, 4,43, 3]);
	let p2D = decode(-1, 4, "112011021322233123132111");

	const setOf = (count, cb = (i)=>i) => { let a = [],i = 0; while (i < count) { a.push(cb(i ++)) } return a };
	const doFor = (count, cb) => { let i = 0; while (i < count && cb(i++) !== true); };

	function shuffleSeed(seed,count = 1){
		seed = seed * 1664525 + 1013904223 | 0;
		count -= 1;
		return count > 0 ? shuffleSeed(seed, count) : seed;
	}
	const types = {
    base : base2D,
    squish : SQUISH_2D,
    dimensions : 2,
    pD : p2D,
    lookup : lookupPairs2D,
	};

	function createContribution(type, baseSet, index) {
		let i = 0;
		const multiplier = baseSet[index ++];
		const c = { next : undefined };
		while(i < type.dimensions){
			const axis = ("xyzw")[i];
			c[axis + "sb"] = baseSet[index + i];
			c["d" + axis] = - baseSet[index + i++] - multiplier * type.squish;
		}
		return c;
	}

	function createLookupPairs(lookupArray, contributions){
		let i;
		const a = lookupArray();
		const res = new Map();
		for (i = 0; i < a.length; i += 2) { res.set(a[i], contributions[a[i + 1]]) }
		return res;
	}

	function createContributionArray(type) {
		const conts = [];
		const d = type.dimensions;
		const baseStep = d * d;
		let k, i = 0;
		while (i < type.pD.length) {
			const baseSet = type.base[type.pD[i]];
			let previous, current;
			k = 0;
			do {
				current = createContribution(type, baseSet, k);
				if (!previous) { conts[i / baseStep] = current }
				else { previous.next = current }
				previous = current;
				k += d + 1;
			} while(k < baseSet.length);

			current.next = createContribution(type, type.pD, i + 1);
			if (d >= 3) { current.next.next = createContribution(type, type.pD, i + d + 2) }
			if (d === 4) { current.next.next.next = createContribution(type, type.pD, i + 11) }
			i += baseStep;
		}
		const result = [conts, createLookupPairs(type.lookup, conts)];
		type.base = undefined;
		type.lookup = undefined;
		return result;
	}

	const [contributions2D, lookup2D] = createContributionArray(types);
	const perm = new Uint8Array(256);
	const perm2D = new Uint8Array(256);
	const source = new Uint8Array(setOf(256, i => i));

  let seed = 0;
  
  function shuffleSeed2() {
    let seed = shuffleSeed(clientSeed, 3);
  
    doFor(256, i => {
      i = 255 - i;
      seed = shuffleSeed(seed);
      let r = (seed + 31) % (i + 1);
      r += r < 0 ? i + 1 : 0;
      perm[i] = source[r];
      perm2D[i] = perm[i] & 0x0E;
      source[r] = source[i];
    });
	}
	
	shuffleSeed2();

	base2D = undefined;
	lookupPairs2D = undefined;
	p2D = undefined;

	const API = {
		seed,
		perm,
		perm2D,
		source,
		updateSeed( newSeed ) {
			this.seed = shuffleSeed( newSeed, 3 );
		
			doFor(256, i => {
				i = 255 - i;
				this.seed = shuffleSeed( this.seed );
				let r = ( this.seed + 31 ) % ( i + 1 );
				r += r < 0 ? i + 1 : 0;
				this.perm[i] = this.source[r];
				this.perm2D[i] = this.perm[i] & 0x0E;
				this.source[r] = this.source[i];
			});
		},
		sampleNoise2DAtCoord(x, y) {
			const p = this.perm;
			const pD = this.perm2D;
			const g = gradients2D;
			const stretchOffset = (x + y) * STRETCH_2D;
			const xs = x + stretchOffset, ys = y + stretchOffset;
			const xsb = Math.floor(xs), ysb = Math.floor(ys);
			const squishOffset	= (xsb + ysb) * SQUISH_2D;
			const dx0 = x - (xsb + squishOffset), dy0 = y - (ysb + squishOffset);
			let c = (() => {
				const xins = xs - xsb, yins = ys - ysb;
				const inSum = xins + yins;
				return lookup2D.get(
					(xins - yins + 1) |
					(inSum << 1) |
					((inSum + yins) << 2) |
					((inSum + xins) << 4)
				);
			})();
			let i, value = 0;
			while (c !== undefined) {
				const dx = dx0 + c.dx;
				const dy = dy0 + c.dy;
				let attn = 2 - dx * dx - dy * dy;
				if (attn > 0) {
					i = pD[(p[(xsb + c.xsb) & 0xFF] + (ysb + c.ysb)) & 0xFF];
					attn *= attn;
					value += attn * attn * (g[i++] * dx + g[i] * dy);
				}
				c = c.next;
			}
			return value * NORM_2D;
		}
	}
	return API;
}