'use strict'

const test = require('tape')
const h = require('hyper-xml')
const rewind = require('@turf/rewind')

const parse = require('.')

const coordsA = [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]
const coordsB = [[2, 2], [2, 5], [5, 5], [5, 2], [2, 2]]
const coordsC = [[3, 3], [3, 4], [4, 4], [4, 3], [3, 3]] // fits into B

const simpleExterior = rewind({
	type: 'Polygon',
	coordinates: [
		[[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]
	]
})
const multiExterior = rewind({
	type: 'MultiPolygon',
	coordinates: [
		[
			[[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]
		], [
			[[20, 20], [20, 50], [50, 50], [50, 20], [20, 20]]
		]
	]
})
const withHole = rewind({
	type: 'Polygon',
	coordinates: [
		[[20, 20], [20, 50], [50, 50], [50, 20], [20, 20]],
		[[30, 30], [30, 40], [40, 40], [40, 30], [30, 30]]
	]
})

const posList = (coords) => {
	return h('gml:posList', [coords.map(c => c.join(' ')).join(' ')])
}
const pos5 = (coords) => {
	return coords.map((c) => {
		return h('gml:pos', [c.join(' ')])
	})
}
const point5 = (coords) => {
	return coords.map((c, i) => {
		return h('gml:Point', {'gml:id': i + ''}, [
			h('gml:pos', [c.join(' ')])
		])
	})
}

const transformCoords = (...vals) => vals.map(val => val * 10)

// see http://erouault.blogspot.de/2014/04/gml-madness.html

// todo: SimplePolygon > posList
// todo: SimpleRectangle > posList

test('Polygon > exterior > LinearRing > posList', (t) => {
	const p = h('gml:Polygon', {'gml:id': 'some-id'}, [
		h('gml:exterior', [
			h('gml:LinearRing', [posList(coordsA)])
		])
	])

	t.deepEqual(parse(p, transformCoords), simpleExterior)
	t.end()
})

test('Polygon > exterior > LinearRing > pos*5', (t) => {
	const p = h('gml:Polygon', {'gml:id': 'some-id'}, [
		h('gml:exterior', [
			h('gml:LinearRing', pos5(coordsA))
		])
	])

	t.deepEqual(parse(p, transformCoords), simpleExterior)
	t.end()
})

test('Polygon > exterior > LinearRing > Point*5 > pos', (t) => {
	const p = h('gml:Polygon', {'gml:id': 'some-id'}, [
		h('gml:exterior', [
			h('gml:LinearRing', point5(coordsA))
		])
	])

	t.deepEqual(parse(p, transformCoords), simpleExterior)
	t.end()
})

test('Rectangle > exterior > LinearRing > posList', (t) => {
	const p = h('gml:Rectangle', [
		h('gml:exterior', [
			h('gml:LinearRing', [posList(coordsA)])
		])
	])

	t.deepEqual(parse(p, transformCoords), simpleExterior)
	t.end()
})

test('Polygon > exterior > Ring > curveMember > LineString > posList', (t) => {
	const p = h('gml:Polygon', {'gml:id': 'some-id'}, [
		h('gml:exterior', [
			h('gml:Ring', [
				h('gml:curveMember', [
					h('gml:LineString', [posList(coordsA)])
				])
			])
		])
	])

	t.deepEqual(parse(p, transformCoords), simpleExterior)
	t.end()
})

test('Polygon > exterior > Ring > curveMember > LineString > pos*5', (t) => {
	const p = h('gml:Polygon', {'gml:id': 'some-id'}, [
		h('gml:exterior', [
			h('gml:Ring', [
				h('gml:curveMember', [
					h('gml:LineString', pos5(coordsA))
				])
			])
		])
	])

	t.deepEqual(parse(p, transformCoords), simpleExterior)
	t.end()
})

test('Polygon > exterior > Ring > curveMember*3 > LineString > posList', (t) => {
	const p = h('gml:Polygon', {'gml:id': 'some-id'}, [
		h('gml:exterior', [
			h('gml:Ring', [
				h('gml:curveMember', [
					h('gml:LineString', [posList(coordsA.slice(0, 2))])
				]),
				h('gml:curveMember', [
					h('gml:LineString', [posList(coordsA.slice(1, 3))])
				]),
				h('gml:curveMember', [
					h('gml:LineString', [posList(coordsA.slice(2, 4))])
				]),
				h('gml:curveMember', [
					h('gml:LineString', [posList(coordsA.slice(3))])
				])
			])
		])
	])

	t.deepEqual(parse(p, transformCoords), simpleExterior)
	t.end()
})

test('Polygon > exterior > Ring > curveMember*2 > Curve > segments > LineStringSegment > posList', (t) => {
	const seg1 = h('gml:LineStringSegment', [posList(coordsA.slice(0, 3))])
	const seg2 = h('gml:LineStringSegment', [posList(coordsA.slice(2))])

	const p = h('gml:Polygon', {'gml:id': 'some-id'}, [
		h('gml:exterior', [
			h('gml:Ring', [
				h('gml:curveMember', [
					h('gml:Curve', [
						h('gml:segments', [seg1])
					])
				]),
				h('gml:curveMember', [
					h('gml:Curve', [
						h('gml:segments', [seg2])
					])
				])
			])
		])
	])
	// console.error(require('util').inspect(p, {depth: Infinity}))

	t.deepEqual(parse(p, transformCoords), simpleExterior)
	t.end()
})

test('Polygon > exterior > Ring > curveMember > Curve > segments > LineStringSegment*2 > posList', (t) => {
	const seg1 = h('gml:LineStringSegment', [posList(coordsA.slice(0, 3))])
	const seg2 = h('gml:LineStringSegment', [posList(coordsA.slice(2))])

	const p = h('gml:Polygon', {'gml:id': 'some-id'}, [
		h('gml:exterior', [
			h('gml:Ring', [
				h('gml:curveMember', [
					h('gml:Curve', [
						h('gml:segments', [seg1, seg2])
					])
				])
			])
		])
	])
	// console.error(require('util').inspect(p, {depth: Infinity}))

	t.deepEqual(parse(p, transformCoords), simpleExterior)
	t.end()
})

test('Surface > patches > PolygonPatch > exterior > LinearRing > posList', (t) => {
	const p = h('gml:Surface', {'gml:id': 'some-id'}, [
		h('gml:patches', [
			h('gml:PolygonPatch', {'gml:id': 'a'}, [
				h('gml:exterior', [
					h('gml:LinearRing', [posList(coordsA)])
				])
			]),
			h('gml:PolygonPatch', {'gml:id': 'b'}, [
				h('gml:exterior', [
					h('gml:LinearRing', [posList(coordsB)])
				])
			])
		])
	])

	t.deepEqual(parse(p, transformCoords), multiExterior)
	t.end()
})

test('Surface > patches > Rectangle*2 > exterior > LinearRing > posList', (t) => {
	const p = h('gml:Surface', {'gml:id': 'some-id'}, [
		h('gml:patches', [
			h('gml:Rectangle', {'gml:id': 'a'}, [
				h('gml:exterior', [
					h('gml:LinearRing', [posList(coordsA)])
				])
			]),
			h('gml:Rectangle', {'gml:id': 'b'}, [
				h('gml:exterior', [
					h('gml:LinearRing', [posList(coordsB)])
				])
			])
		])
	])

	t.deepEqual(parse(p, transformCoords), multiExterior)
	t.end()
})

test('MultiSurface > surfaceMember*2 > Surface > patches > Rectangle > …', (t) => {
	const s1 = h('gml:Surface', {'gml:id': 's1'}, [
		h('gml:patches', [
			h('gml:Rectangle', [
				h('gml:exterior', [
					h('gml:LinearRing', [posList(coordsA)])
				])
			])
		])
	])
	const s2 = h('gml:Surface', {'gml:id': 's2'}, [
		h('gml:patches', [
			h('gml:Rectangle', [
				h('gml:exterior', [
					h('gml:LinearRing', [posList(coordsB)])
				])
			])
		])
	])
	const m = h('gml:MultiSurface', {'gml:id': 'm'}, [
		h('gml:surfaceMember', [s1]),
		h('gml:surfaceMember', [s2])
	])

	t.deepEqual(parse(m, transformCoords), multiExterior)
	t.end()
})

test('MultiSurface > surfaceMember*2 > Polygon > …', (t) => {
	const p1 = h('gml:Polygon', {'gml:id': 'p1'}, [
		h('gml:exterior', [
			h('gml:LinearRing', [posList(coordsA)])
		])
	])
	const p2 = h('gml:Polygon', {'gml:id': 'p2'}, [
		h('gml:exterior', [
			h('gml:LinearRing', [posList(coordsB)])
		])
	])
	const m = h('gml:MultiSurface', {'gml:id': 'm'}, [
		h('gml:surfaceMember', [p1]),
		h('gml:surfaceMember', [p2])
	])

	t.deepEqual(parse(m, transformCoords), multiExterior)
	t.end()
})

test('MultiSurface > surfaceMember > CompositeSurface > surfaceMember > Polygon > …', (t) => {
	const p1 = h('gml:Polygon', {'gml:id': 'p1'}, [
		h('gml:exterior', [
			h('gml:LinearRing', [posList(coordsA)])
		])
	])
	const p2 = h('gml:Polygon', {'gml:id': 'p2'}, [
		h('gml:exterior', [
			h('gml:LinearRing', [posList(coordsB)])
		])
	])
	const m = h('gml:MultiSurface', {'gml:id': 'm'}, [
		h('gml:surfaceMember', [
			h('gml:CompositeSurface', {'gml:id': 'c'}, [
				h('gml:surfaceMember', [p1]),
				h('gml:surfaceMember', [p2])
			])
		])
	])

	t.deepEqual(parse(m, transformCoords), multiExterior)
	t.end()
})

test('Polygon > exterior+interior > LinearRing > posList', (t) => {
	const p = h('gml:Polygon', {'gml:id': 'some-id'}, [
		h('gml:exterior', [
			h('gml:LinearRing', [posList(coordsB)])
		]),
		h('gml:interior', [
			h('gml:LinearRing', [posList(coordsC)])
		])
	])

	t.deepEqual(parse(p, transformCoords), withHole)
	t.end()
})

test('stride === 3', (t) => {
	const p = h('gml:Polygon', {'gml:id': 'some-id'}, [
		h('gml:exterior', [
			h('gml:LinearRing', [
				h('gml:posList', [[
					1, 1, 0,
					1, 2, 0,
					2, 2, 0
				].join(' ')])
			])
		])
	])

	t.deepEqual(parse(p, transformCoords, 3), rewind({
		type: 'Polygon',
		coordinates: [[
			[10, 10, 0],
			[10, 20, 0],
			[20, 20, 0]
		]]
	}))
	t.end()
})

test('posList with srsDimension of 3', (t) => {
	const p = h('gml:Polygon', {'gml:id': 'some-id'}, [
		h('gml:exterior', [
			h('gml:LinearRing', [
				h('gml:posList', {srsDimension: '3'}, [[
					1, 1, 4,
					1, 2, 4,
					2, 2, 4
				].join(' ')])
			])
		]),
		h('gml:interior', [
			h('gml:LinearRing', [
				h('gml:pos', {srsDimension: '3'}, [[1, 1, 5].join(' ')]),
				h('gml:pos', {srsDimension: '3'}, [[1, 2, 5].join(' ')]),
				h('gml:pos', {srsDimension: '3'}, [[2, 2, 5].join(' ')])
			])
		])
	])

	t.deepEqual(parse(p), rewind({
		type: 'Polygon',
		coordinates: [[
			[1, 1, 4],
			[1, 2, 4],
			[2, 2, 4]
		], [
			[1, 1, 5],
			[1, 2, 5],
			[2, 2, 5]
		]]
	}))
	t.end()
})

// todo: Polygon > exterior > Ring > curveMember > Curve > segments > LineStringSegment*4 > pointProperty*2 > Point > pos
// todo: Polygon > exterior > Ring > curveMember > CompositeCurve > curveMember > LineString > posList
// todo: Polygon > exterior > Ring > curveMember*2 > OrientableCurve > baseCurve > LineString > pos*3
