/**
 * MotionWalk Line of Sight plugin for Impact.js
 *
 * @version 0.1
 * @date 2015-04-22
 * @author eastecho eastecho@outlook.com
 * see https://github.com/eastecho/impact-los for more information
 *
 */
ig.module(
    'plugins.mw_los'
)
.requires(
    'impact.impact'
)
.defines(function() {

    ig.MW_LineOfSight = ig.Class.extend({

        /**
         * The switch to the debug mode
         */
        debugMode: false,

        /**
         * Player entity
         */
        player: undefined,

        /**
         * Game board size
         */
        board: { width: 0, height: 0},

        /**
         * The size of the tile (Square)
         */
        tileSize: 0,

        /**
         * Generated map to be calculated
         */
        losMap: undefined,

        /**
         * The generated map size
         */
        losMapSize: { width: 0, height: 0},

        /**
         * Player's location
         */
        playerLocation: { x: 0, y: 0 },

        /**
         * Old player position, to check if the player moved
         */
        oldPlayerPosition: { x: 0, y: 0 },

        /**
         * The start location
         */
        startLocation: { x: 0, y: 0 },

        /**
         * The edges array
         */
        edges: [ ],

        /**
         * Color settings
         */
        startColor: undefined,
        endColor: undefined,
        startRadius: undefined,
        endRadius: undefined,
        strokeColor: undefined,

        /**
         * Init
         * @param vars
         */
        init: function(vars) {
            if (vars.debug == undefined)
                this.debugMode = false;
            else
                this.debugMode = vars.debug;

            // Colors
            if (vars.strokeColor != undefined)  this.strokeColor = vars.strokeColor;
            this.startColor = (vars.startColor == undefined) ? 'rgba(0, 0, 0, 0)' : vars.startColor;
            this.endColor = (vars.endColor == undefined) ? 'rgba(0, 0, 0, 0.55)' : vars.endColor;
            this.startRadius = (vars.startRadius == undefined) ? (ig.system.height/2)/ig.system.scale : vars.startRadius;
            this.endRadius = (vars.endRadius == undefined) ? ig.system.height/2 : vars.endRadius;

            this.board = { width: ig.game.collisionMap.width, height: ig.game.collisionMap.height };
            this.tileSize = ig.game.collisionMap.tilesize;
            this.player = vars.player;
            oldPlayerPosition = { x:this.player.pos.x, y:this.player.pos.y };
        },

        /**
         * Draw the line of sight
         */
        drawLOS: function() {
            var tileSize = this.tileSize;

            // get center location of player
            this.playerLocation.x = Math.floor((this.player.pos.x + this.player.size.x / 2) / tileSize);
            this.playerLocation.y = Math.floor((this.player.pos.y + this.player.size.y / 2) / tileSize);

            if (this.player.pos.x != this.oldPlayerPosition.x || this.player.pos.y != this.oldPlayerPosition.y) {
                // Firstly get the generated map
                this.getMap();

                // Secondly get the edges
                this.getForwardEdges();

                if (this.debugMode) console.log('Edge count:', this.edges.length);

                // Then, calculate the projection
                this.calculateProjections();

                this.oldPlayerPosition = { x:this.player.pos.x, y:this.player.pos.y };
            }
        },

        /**
         * Get the map that is going to be calculated
         */
        getMap: function() {
            var cx = this.playerLocation.x;
            var cy = this.playerLocation.y;
            var tileSize = this.tileSize;

            // get the display area
            // plus 2 to get a little bit more out of the screen
            var w = Math.round((Math.ceil(ig.system.width / tileSize) + 2) / 2);
            var h = Math.round((Math.ceil(ig.system.height / tileSize) + 2) / 2);

            var startX = (cx - w - 1) > 0 ? cx - w - 1 : 0;
            var endX = (cx + w - 1) > (this.board.width - 2) ? this.board.width - 2 : cx + w - 1;
            var startY = (cy - h - 1) > 0 ? cy - h - 1 : 0;
            var endY = (cy + h - 1) > (this.board.height - 2) ? this.board.height - 2 : cy + h - 1;

            this.startLocation = { x:cx - startX, y:cy - startY };
            this.losMapSize = { width:endX - startX + 2, height:endY - startY + 2 };

            // add borders
            // put collision map data into los map
            var i, j;
            this.losMap = new Array(this.losMapSize.height);
            for (i=0; i<this.losMapSize.height; i++) {
                this.losMap[i] = new Array(this.losMapSize.width);
                for(j=0; j<this.losMapSize.width; j++) {
                    if (i==0 || j==0 || i==(this.losMapSize.height-1) || j==(this.losMapSize.width-1))
                        this.losMap[i][j] = 1;
                    else {
                        this.losMap[i][j] = ig.game.collisionMap.data[startY + i][startX + j];
                    }
                }
            }

            /********* debug *********/
            if (this.debugMode) {
                console.log('\nMAP (Loc: ' + cy + ', ' + cx + ') (Size: ' + this.losMapSize.width + ' x ' + this.losMapSize.height + ')');
                var str;
                for (i=0; i<this.losMapSize.height; i++) {
                    str = i+10000 + '  ';
                    for(j=0; j<this.losMapSize.width; j++) {
                        if (i == this.startLocation.y && j == this.startLocation.x)
                            str += '0 ';
                        else
                            str += (this.losMap[i][j] == 0) ? '. ' : '# ';
                    }
                    console.log(str);
                }
            } // end of debug
        },

        /**
         * Get all the forward edges
         */
        getForwardEdges: function() {
            var x, y, i;
            var tileSize = this.tileSize;

            this.edges = [ ];

            for (y=0; y<this.losMapSize.height; y++) {
                for (x = 0; x < this.losMapSize.width; x++) {
                    if (this.losMap[y][x] == 1) {
                        var topLeft = this.topLeftCorner(x, y);
                        // check for up side, data direction >>>
                        if ((y-1 >= 0) && (this.losMap[y-1][x] != 1) && (this.startLocation.y < y))
                            this.addEdge(topLeft, { x: topLeft.x + tileSize, y: topLeft.y});
                        // check for down side, data direction <<<
                        if ((y+1 < this.losMapSize.height) && (this.losMap[y+1][x] != 1) && (this.startLocation.y > y))
                            this.addEdge({ x: topLeft.x + tileSize, y: topLeft.y + tileSize}, { x: topLeft.x, y: topLeft.y + tileSize});
                        // check for left side, data direction ^^^
                        if ((x-1 >= 0) && (this.losMap[y][x-1] != 1) && (this.startLocation.x < x))
                            this.addEdge({ x: topLeft.x, y: topLeft.y + tileSize}, { x: topLeft.x, y: topLeft.y});
                        // check for right side, data direction vvv
                        if ((x+1 < this.losMapSize.width) && (this.losMap[y][x+1] != 1) && (this.startLocation.x > x))
                            this.addEdge({ x: topLeft.x + tileSize, y: topLeft.y}, { x: topLeft.x + tileSize, y: topLeft.y + tileSize});
                    }
                }
            }

            // Make a copy and sort distance    // var edgesClone = this.edges.slice(0);
            for (i=this.edges.length-1; i>=0; i--) {
                var e = this.edges[i];
                var midPosition = { x:(e.p1.x + e.p2.x)/2, y:(e.p1.y + e.p2.y)/2 };
                e.distance = Math.round(Math.sqrt((midPosition.x - ig.system.width/2)*(midPosition.x - ig.system.width/2) + (midPosition.y - ig.system.height/2)*(midPosition.y - ig.system.height/2)));
                this.edges[i] = e;
            }

            this.edges.sort(function(x, y) {
                return x.distance - y.distance;
            });

            // Connect edges
            for (i=0; i<this.edges.length; i++) {
                var eNow = this.edges[i];
                if (eNow.prev != -1 && eNow.next != -1)
                    continue;
                for(var j=0; j<this.edges.length; j++) {
                    if (i == j)
                        continue;
                    var eCheck = this.edges[j];
                    if (eCheck.prev != -1 && eCheck.next != -1)
                        continue;
                    if (eNow.p2.x == eCheck.p1.x && eNow.p2.y == eCheck.p1.y) {
                        eNow.next = j;
                        eCheck.prev = i;
                    }
                }
            }
        },

        /**
         * Calculate for the projections
         */
        calculateProjections: function() {
            var i;

            // Start from the beginning to project lines
            for (i=0; i<this.edges.length; i++) {
                var e = this.edges[i];
                var abc;
                var intersectionData;
                var lightSource = { x:ig.system.width/2, y:ig.system.height/2 };

                // Find not connected point for next
                if (e.next == -1) {
                    abc = this.getLineABC(e.p2, lightSource);
                    intersectionData = this.checkIntersection(abc, e.p2, i);

                    // if found intersection point then split the edge at intersection point
                    if (intersectionData.intersectID != -1) {
                        this.updateEdge(i, intersectionData.intersectID, { x:intersectionData.x, y:intersectionData.y }, true);
                    }
                }
                // Find not connected point for prev
                if (e.prev == -1) {
                    abc = this.getLineABC(e.p1, lightSource);
                    intersectionData = this.checkIntersection(abc, e.p1, i);

                    // if found intersection point then split the edge at intersection point
                    if (intersectionData.intersectID != -1) {
                        this.updateEdge(i, intersectionData.intersectID, { x:intersectionData.x, y:intersectionData.y }, false);
                    }
                }
            }
        },

        /********** Support functions **********/

        /**
         * Get the top left corner of a given tile location
         * @param x
         * @param y
         * @returns {{x: number, y: number}}
         */
        topLeftCorner: function(x, y) {
            // Center position
            var cx = ig.system.width/2;
            var cy = ig.system.height/2;
            // Delta x, y
            var dx = (x - this.startLocation.x) * this.tileSize - this.tileSize/2 - (this.player.pos.x - this.playerLocation.x * this.tileSize);
            var dy = (y - this.startLocation.y) * this.tileSize - this.tileSize/2 - (this.player.pos.y - this.playerLocation.y * this.tileSize);
            return { x:cx + dx, y:cy + dy }
        },

        addEdge: function(p1, p2) {
            var edge = new ig.MW_LOSEdge();
            edge.p1.x = p1.x;   edge.p2.x = p2.x;
            edge.p1.y = p1.y;   edge.p2.y = p2.y;

            this.edges.push(edge);
        },

        /**
         * Give 2 points, return line ABC (ax2 + bx + c = 0)
         * @param pt1
         * @param pt2
         * @returns {*}
         */
        getLineABC: function(pt1, pt2) {
            var abc;

            if ((pt1.y == pt2.y) && (pt1.x == pt2.x)) {
                abc = { a:0, b:0, c:0 };
            } else if (pt1.x == pt2.x) {
                abc = { a:1, b:0, c:-pt1.x }
            } else {
                abc = { a:-(pt2.y - pt1.y) / (pt2.x - pt1.x), b:1, c:pt1.x * (pt2.y - pt1.y) / (pt2.x - pt1.x) - pt1.y };
            }

            return abc;
        },

        /**
         * Check intersection between current edge and other edges
         * @param lineABC       The a b c of current edge
         * @param point         Point on current edge
         * @param currentID     Current edge id
         * @returns {{x: (number|x), y: (number|y), intersectID: *}}
         */
        checkIntersection: function(lineABC, point, currentID) {
            var i,
                p,
                abc;
            var found = false;
            var lightSource = { x:ig.system.width/2, y:ig.system.height/2 };

            for (i=0; i<this.edges.length; i++) {
                // Skip current point
                if (i != currentID) {
                    var edge = this.edges[i];

                    abc = this.getLineABC(edge.p1, edge.p2);
                    p = this.getIntersectionPoint(abc, lineABC);

                    if ((p.x == point.x) && (p.y == point.y))   continue;   // Skip current point, confirm

                    // check direction, intersections in the middle will be ignored
                    if ((lightSource.x > point.x) && (p.x > point.x))   continue;
                    if ((lightSource.x < point.x) && (p.x < point.x))   continue;
                    if ((lightSource.y > point.y) && (p.y > point.y))   continue;
                    if ((lightSource.y < point.y) && (p.y < point.y))   continue;

                    // check if the intersection point is not on the edge
                    var bigX, bigY, smallX, smallY;
                    if (edge.p1.x > edge.p2.x) {
                        bigX = edge.p1.x;       smallX = edge.p2.x;
                    } else {
                        bigX = edge.p2.x;       smallX = edge.p1.x;
                    }

                    if (edge.p1.y > edge.p2.y) {
                        bigY = edge.p1.y;       smallY = edge.p2.y;
                    } else {
                        bigY = edge.p2.y;       smallY = edge.p1.y;
                    }

                    // If the intersection point is note on the edge, ignore it
                    if ((p.x < smallX) || (p.x > bigX) || (p.y < smallY) || (p.y > bigY))
                        continue;

                    found = true;
                    break;

                } // end if

            } // end for

            // if not found, marked as not found with zero filled
            if (!found) {
                p = { x: 0, y: 0 };
                i = -1;
            }

            // return intersection point and intersect id
            return { x:p.x, y: p.y, intersectID:i};
        },

        /**
         * Update the edge
         * @param edgeID            The edge that start the projection
         * @param targetEdgeID      The target edge
         * @param p                 Intersection point
         * @param isNext            Is this a next check?
         */
        updateEdge: function(edgeID, targetEdgeID, p, isNext) {
            // The edge that start the projection
            var edgeStart = this.edges[edgeID];
            // The target edge
            var edgeToBeSliced = this.edges[targetEdgeID];

            // Calculate for the edge to be kept
            if (isNext) {
                edgeStart.next = targetEdgeID;
                edgeToBeSliced.p1 = p;
                edgeToBeSliced.prev = edgeID;
            } else {
                edgeStart.prev = targetEdgeID;
                edgeToBeSliced.p2 = p;
                edgeToBeSliced.next = edgeID;
            }

            // Update all the 3 edges
            this.edges[edgeID] = edgeStart;
            this.edges[targetEdgeID] = edgeToBeSliced;
        },

        /**
         * Get intersection point
         * @param abc1
         * @param abc2
         * @returns {{x: number, y: number}}
         */
        getIntersectionPoint: function(abc1, abc2) {
            var p = { x:0, y:0 };
            var x = 0,
                y = 0;
            var a1 = abc1.a, b1 = abc1.b, c1 = abc1.c,
                a2 = abc2.a, b2 = abc2.b, c2 = abc2.c;

            if ((b1 == 0) && (b2 == 0)) {
                return p;
            } else if (b1 == 0) {
                x = -c1;
                y = -(a2 * x + c2) / b2;
            } else if (b2 == 0) {
                x = -c2;
                y = -(a1 * x + c1) / b1;
            } else {
                if ((a1 / b1) == (a2 / b1)) {
                    return p;
                } else {
                    x = (c1 - c2) / (a2  - a1);
                    y = -(a1 * x) - c1;
                }
            }

            p = { x:x, y:y };

            return p;
        },

        /**
         * Draw forward edges
         */
        drawForwardEdges: function() {
            var ctx = ig.system.context;
            var scale = ig.system.scale;

            ctx.strokeStyle = "rgba(255, 255, 0, 1)";
            ctx.beginPath();

            for(var i=0; i<this.edges.length; i++) {
                var e = this.edges[i];
                ctx.moveTo(e.p1.x * scale, e.p1.y * scale);
                ctx.lineTo(e.p2.x * scale, e.p2.y * scale);
            }

            ctx.stroke();
        },

        /**
         * Draw calculated edges
         */
        drawCalculatedEdges: function() {
            var ctx = ig.system.context;
            var scale = ig.system.scale;

            var edge = this.edges[0];
            var next = edge.next;

            if (this.strokeColor != undefined)
                ctx.strokeStyle = this.strokeColor;

            var grd = ctx.createRadialGradient(ig.system.width/2 * scale, ig.system.height/2 * scale, this.startRadius * scale, ig.system.width/2 * scale, ig.system.height/2 * scale, this.endRadius * scale);
            grd.addColorStop(0, this.startColor);
            grd.addColorStop(1, this.endColor);
            ctx.fillStyle = grd;

            // Inside

            var debugPoints = '';

            ctx.beginPath();

            ctx.moveTo(edge.p1.x * scale, edge.p1.y * scale);
            ctx.lineTo(edge.p2.x * scale, edge.p2.y * scale);

            debugPoints += 'start : (' + edge.p1.x * scale + ',' + edge.p1.y * scale + ' -> ' + edge.p2.x * scale + ',' + edge.p2.y * scale + ') next:' + next + '\n';

            while (next > 0) {
                targetEdge = this.edges[next];

                ctx.lineTo(targetEdge.p1.x * scale, targetEdge.p1.y * scale);
                ctx.lineTo(targetEdge.p2.x * scale, targetEdge.p2.y * scale);

                debugPoints += next + ' : (' + targetEdge.p1.x * scale + ',' + targetEdge.p1.y * scale + ' -> ' + targetEdge.p2.x * scale + ',' + targetEdge.p2.y * scale + ')';

                next = targetEdge.next;

                debugPoints += ' next:' + next + '\n';
            }

            ctx.lineTo(edge.p1.x * scale, edge.p1.y * scale);

            debugPoints += '(' + edge.p1.x * scale + ',' + edge.p1.y * scale + ')';

            ctx.fill();
            if (this.strokeColor != undefined)
                ctx.stroke();

            if (this.debugMode)
                console.log(debugPoints);

            ctx.fillStyle = this.endColor;
            ctx.beginPath();

            edge = this.edges[0];
            next = edge.next;

            ctx.moveTo(edge.p1.x * scale, edge.p1.y * scale);
            ctx.lineTo(edge.p2.x * scale, edge.p2.y * scale);

            while (next > 0) {
                targetEdge = this.edges[next];
                ctx.lineTo(targetEdge.p1.x * scale, targetEdge.p1.y * scale);
                ctx.lineTo(targetEdge.p2.x * scale, targetEdge.p2.y * scale);

                next = targetEdge.next;
            }

            ctx.lineTo(edge.p1.x * scale, edge.p1.y * scale);
            ctx.moveTo(0, 0);
            ctx.lineTo(ig.system.width * scale, 0);
            ctx.lineTo(ig.system.width * scale, ig.system.height * scale);
            ctx.lineTo(0, ig.system.height * scale);
            ctx.lineTo(0, 0);

            ctx.fill();
        }
    });


    ig.MW_LOSEdge = ig.Class.extend({

        p1 : { x:0, y:0 },
        p2 : { x:0, y:0 },
        prev: -1,
        next: -1,
        distance: 0

    });


});
