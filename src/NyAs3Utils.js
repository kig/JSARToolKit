/*
 * JSARToolkit
 * --------------------------------------------------------------------------------
 * This work is based on the original ARToolKit developed by
 *   Hirokazu Kato
 *   Mark Billinghurst
 *   HITLab, University of Washington, Seattle
 * http://www.hitl.washington.edu/artoolkit/
 *
 * And the NyARToolkitAS3 ARToolKit class library.
 *   Copyright (C)2010 Ryo Iizuka
 *
 * JSARToolkit is a JavaScript port of NyARToolkitAS3.
 *   Copyright (C)2010 Ilmari Heikkinen
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * 
 * For further information please contact.
 *   ilmari.heikkinen@gmail.com
 *
 */

if (!window.console) console = { log : function(){} };

ASVector = function(elements) {
  elements = elements || 0;
  if (elements.length) {
    this.length = elements.length;
    for (var i=0; i<elements.length; i++)
      this[i] = elements[i];
  } else {
    this.length = elements;
    for (var i=0; i<elements; i++)
      this[i] = 0;
  }
}
ASVector.prototype = {};
ASVector.prototype.set = function(idx, val) {
  if (idx.length)
    ASVector.call(this, idx);
  else
    this[idx] = val;
}

if (typeof Float32Array == 'undefined') {
  FloatVector = ASVector;
  IntVector = ASVector;
  UintVector = ASVector;
} else {
  FloatVector = Float32Array;
  IntVector = Int32Array;
  UintVector = Uint32Array;
}

toInt = Math.floor;

Object.extend = function(dst, src) {
  for (var i in src) {
    try{ dst[i] = src[i]; } catch(e) {}
  }
  return dst;
}

toArray = function(obj) {
  var a = new Array(obj.length);
  for (var i=0; i<obj.length; i++)
    a[i] = obj[i];
  return a;
}

Klass = (function() {
  var c = function() {
    if (this.initialize)
      this.initialize.apply(this, arguments);
  }
  c.ancestors = toArray(arguments);
  c.prototype = {};
  for(var i = 0; i<arguments.length; i++) {
    var a = arguments[i];
    if (a.prototype) {
      Object.extend(c.prototype, a.prototype);
    } else {
      Object.extend(c.prototype, a);
    }
  }
  Object.extend(c, c.prototype);
  return c;
})

Object.asCopy = function(obj) {
  if (typeof obj != 'object') {
    return obj;
  } else if (obj instanceof FloatVector) {
    var v = new FloatVector(obj.length);
    for (var i=0; i<v.length; i++)
      v[i] = obj[i];
    return v;
  } else if (obj instanceof IntVector) {
    var v = new IntVector(obj.length);
    for (var i=0; i<v.length; i++)
      v[i] = obj[i];
    return v;
  } else if (obj instanceof UintVector) {
    var v = new UintVector(obj.length);
    for (var i=0; i<v.length; i++)
      v[i] = obj[i];
    return v;
  } else if (obj instanceof Array) {
    return obj.map(Object.asCopy);
  } else {
    var newObj = {};
    for (var i in obj) {
      var v = obj[i];
      if (typeof v == 'object') {
        v = Object.asCopy(v);
      }
      newObj[i] = v;
    }
    return newObj;
  }
}

ASKlass = (function(name) {
  var c = function() {
    var cc = this.__copyObjects__;
    for (var i=0; i<cc.length; i++)
      this[cc[i]] = Object.asCopy(this[cc[i]])
    if (this.initialize)
      this.initialize.apply(this, arguments);
  }
  c.ancestors = toArray(arguments).slice(1);
  c.prototype = {};
  for(var i = 1; i<arguments.length; i++) {
    var a = arguments[i];
    if (a.prototype) {
      Object.extend(c.prototype, a.prototype);
    } else {
      Object.extend(c.prototype, a);
    }
  }
  c.prototype.className = name;
  c.prototype.initialize = c.prototype[name];
  c.prototype.__copyObjects__ = [];
  for (var i in c.prototype) {
    var v = c.prototype[i];
    if (i != '__copyObjects__') {
      if (typeof v == 'object') {
        c.prototype.__copyObjects__.push(i);
      }
    }
  }
  Object.extend(c, c.prototype);
  return c;
})


/**
 * A partial implementation of the ActionScript3 BitmapData class.
 * See: http://www.adobe.com/livedocs/flash/9.0/ActionScriptLangRefV3/flash/display/BitmapData.html
 */
BitmapData = Klass({
  initialize : function(i_width, i_height, transparent, fill) {
    this.width = i_width;
    this.height = i_height;
    this.transparent = (transparent == null ? true : transparent);
    this.fill = (fill == null ? 0xffffffff : fill);
    this.data = new UintVector(i_width*i_height);
    for (var i=0; i<this.data.length; i++) {
      this.data[i] = fill;
    }
    this.rect = new Rectangle(0,0,this.width, this.height);
  },
  fillRect : function(rect, value) {
    var stride = this.width;
    var y = Math.clamp(rect.y,0,this.height)*stride
      , y2 = Math.clamp(rect.y+rect.height,0,this.height)*stride
      , x = Math.clamp(rect.x,0,this.width)
      , x2 = Math.clamp(rect.x+rect.width,0,this.width);
    var d = this.data;
    for (var y1=y;y1<y2; y1+=stride)
      for (var x1=x;x1<x2; x1++)
        d[y1+x1] = value;
  },
  getPixel32 : function(x,y) {
    return this.data[y*this.width + x];
  },
  setPixel32 : function(x,y,v) {
    return this.data[y*this.width + x] = v;
  },
  getPixel : function(x,y) {
    return this.data[y*this.width + x] & 0x00ffffff;
  },
  setPixel : function(x,y,v) {
    return this.data[y*this.width + x] = v | (this.data[y*this.width + x] & 0xff000000);
  },
  getWidth : function () { return this.width; },
  getHeight : function () { return this.height; },
  copyPixels : function(source, rect, offset) {
    var tstride = this.width;
    var stride = source.width;
    var d = source.data;
    var td = this.data;
    var ty = Math.clamp(offset.y,0,this.height)*tstride
      , ty2 = Math.clamp(offset.y+rect.height,0,this.height)*tstride
      , tx = Math.clamp(offset.x,0,this.width)
      , tx2 = Math.clamp(offset.x+rect.width,0,this.width);
    var y = Math.clamp(rect.y,0,source.height)*stride
      , y2 = Math.clamp(rect.y+rect.height,0,source.height)*stride
      , x = Math.clamp(rect.x,0,source.width)
      , x2 = Math.clamp(rect.x+rect.width,0,source.width);
    for (var y1=y,ty1=ty; y1<y2 && ty1<ty2; y1+=stride,ty1+=tstride)
      for (var x1=x,tx1=tx; x1<x2 && tx1<tx2; x1++,tx1++)
        td[ty1+tx1] = d[y1+x1];
  },
  getColorBoundsRect : function(mask, color, findColor) {
    if (findColor) {
      return this.getColorBoundsRect_true(mask, color);
    } else {
      return this.getColorBoundsRect_false(mask, color);
    }
  },
  getColorBoundsRect_true : function(mask, color) {
    var minX=this.width, minY=this.height, maxX=0, maxY=0;
    var w = this.width; h=this.height;
    var d = this.data;
    var m = 0, off = 0;
    minYfor: for (var y=0; y<h; y++) {
      off = y*w-1;
      for (var x=0; x<w; x++) {
        m = (d[++off] & mask) - color;
        if (!m) {
          minX = maxX = x;
          minY = maxY = y;
          break minYfor;
        }
      }
    }
    maxYfor: for (var y=h-1; y>minY; y--) {
      off = y*w-1;
      for (var x=0; x<w; x++) {
        m = (d[++off] & mask) - color;
        if (!m) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          maxY = y;
          break maxYfor;
        }
      }
    }
    for (var y=minY; y<=maxY; y++) {
      off = y*w-1;
      for (var x=0; x<minX; x++) {
        m = (d[++off] & mask) - color;
        if (!m) {
          minX = x;
          break;
        }
      }
      off = y*w+w;
      for (var x=w-1; x>maxX; x--) {
        m = (d[--off] & mask) - color;
        if (!m) {
          maxX = x;
          break;
        }
      }
    }
    return new Rectangle(minX, minY, Math.max(0,maxX-minX), Math.max(0,maxY-minY));
  },
  getColorBoundsRect_false : function(mask, color) {
    var minX=this.width, minY=this.height, maxX=0, maxY=0;
    var w = this.width; h=this.height;
    var d = this.data;
    minYfor: for (var y=0; y<h; y++) {
      for (var x=0; x<w; x++) {
        var m = (d[y*w+x] & mask) - color;
        if (m) {
          minX = maxX = x;
          minY = maxY = y;
          break minYfor;
        }
      }
    }
    maxYfor: for (var y=h-1; y>minY; y--) {
      for (var x=0; x<w; x++) {
        var m = (d[y*w+x] & mask) - color;
        if (m) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          maxY = y;
          break maxYfor;
        }
      }
    }
    for (var y=minY; y<=maxY; y++) {
      for (var x=0; x<minX; x++) {
        var m = (d[y*w+x] & mask) - color;
        if (m) {
          minX = x;
          break;
        }
      }
      for (var x=h-1; x>maxX; x--) {
        var m = (d[y*w+x] & mask) - color;
        if (m) {
          maxX = x;
          break;
        }
      }
    }
    return new Rectangle(minX, minY, Math.max(0,maxX-minX), Math.max(0,maxY-minY));
  },
  putImageData : function(imageData, x,y, w,h) {
    w = Math.clamp(w,0,imageData.width), h = Math.clamp(h,0,imageData.height);
    var stride = this.width;
    var d = this.data;
    var td = imageData.data;
    var y = Math.clamp(y,0,this.height)*stride
      , y2 = Math.clamp(y+h,0,this.height)*stride
      , x = Math.clamp(x,0,this.width)
      , x2 = Math.clamp(x+w,0,this.width);
    for (var y1=y,ty1=0; y1<y2; y1+=stride,ty1+=imageData.width*4) {
      for (var x1=x,tx1=0; x1<x2; x1++,tx1+=4) {
        d[y1+x1] = ( // transform canvas pixel to 32-bit ARGB int
          (td[ty1+tx1] << 16) |
          (td[ty1+tx1+1] << 8) |
          (td[ty1+tx1+2]) |
          (td[ty1+tx1+3] << 24)
        );
      }
    }
  },
  drawCanvas : function(canvas, x,y,w,h) {
    this.putImageData(canvas.getContext('2d').getImageData(0,0,w,h),x,y,w,h);
  },
  drawOnCanvas : function(canvas) {
    var ctx = canvas.getContext('2d');
    var id = ctx.getImageData(0,0,this.width,this.height);
    var stride = this.width;
    var length = this.height*stride;
    var d = this.data;
    var td = id.data;
    for (var y=0; y<length; y+=stride) {
      for (var x=0; x<stride; x++) {
        var base = 4*(y+x);
        var c = d[y+x];
        td[base] = (c >> 16) & 0xff;
        td[++base] = (c >> 8) & 0xff;
        td[++base] = (c) & 0xff;
        td[++base] = (c >> 24) & 0xff;
      }
    }
    ctx.putImageData(id, 0,0);
  },
  floodFill : function(x, y, nv) {
    var l=0, x1=0, x2=0, dy=0;
    var ov=0; /* old pixel value */
    var stack = [];
    var w = this.width, h = this.height;
    var stride = this.width;
    var data = this.data;

    ov = data[y*stride + x];
    if (ov==nv || x<0 || x>=w || y<0 || y>=h) return;
    stack.push([y, x, x, 1]);     /* needed in some cases */
    stack.push([y+1, x, x, -1]);    /* seed segment (popped 1st) */

    while (stack.length > 0) {
      /* pop segment off stack and fill a neighboring scan line */
      var a = stack.pop();
      y = a[0]+a[3], x1 = a[1], x2 = a[2], dy = a[3];
      /*
      * segment of scan line y-dy for x1<=x<=x2 was previously filled,
      * now explore adjacent pixels in scan line y
      */
      for (x=x1; x>=0 && data[y*stride + x]==ov; x--)
        data[y*stride + x] = nv;
      if (x<x1) {
        l = x+1;
        if (l<x1) stack.push([y, l, x1-1, -dy]);    /* leak on left? */
        x = x1+1;
        for (; x<w && data[y*stride + x]==ov; x++)
          data[y*stride + x] = nv;
        stack.push([y, l, x-1, dy]);
        if (x>x2+1) stack.push([y, x2+1, x-1, -dy]);  /* leak on right? */
      }
      for (x++; x<=x2 && data[y*stride + x]!=ov; x++)
        null;
      l = x;
      while (x<=x2) {
        for (; x<w && data[y*stride + x]==ov; x++)
          data[y*stride + x] = nv;
        stack.push([y, l, x-1, dy]);
        if (x>x2+1) stack.push([y, x2+1, x-1, -dy]);  /* leak on right? */
        for (x++; x<=x2 && data[y*stride + x]!=ov; x++)
          null;
        l = x;
      }
    }
  }
})

Rectangle = Klass({
  initialize : function(x,y,w,h){
    this.x = x; this.y = y;
    this.top = y; this.left = x;
    this.bottom = y+h; this.right = x+w;
    this.width = w; this.height = h;
    this.updateCalc();
  },
  updateCalc : function() {
    this.top = this.y;
    this.left = this.x;
    this.bottom = this.y+this.height;
    this.right = this.x+this.width;
  },
  clone : function() {
    return new Rectangle(this.x, this.y, this.width, this.height);
  },
  inflate : function(dx,dy) {
    this.x -= dx;
    this.y -= dy;
    this.width += 2 * dx;
    this.height += 2 * dy;
    this.updateCalc();
  },
  isEmpty : function() {
    return (this.width <= 0 && this.height <= 0)
  }
})

/**
  * The Exception object used by NyARToolkit.
  */
NyARException = Klass(Error,
{
  initialize : function(m)
  {
    Error.call(this,m);
  },
  trap : function(m)
  {
    throw new NyARException("trap:" + m);
  },

  notImplement : function()
  {
    throw new NyARException("Not Implement!");
  }
})

NyAS3Const_Inherited = Klass({
})

NyAS3Utils = Klass(
{
  assert : function(e, mess)
  {
    if(!e){throw new Error("NyAS3Utils.assert:"+mess!=null?mess:"");}
  }
})

NyARVec = Klass(
{
  clm : null,
  v : null,

  initialize : function(i_clm)
  {
    this.v = new FloatVector(i_clm);
    this.clm = i_clm;
  },

  getClm : function()
  {
    return this.clm;
  },
  getArray : function()
  {
    return this.v;
  }
})

/**
  * ARMat構造体に対応するクラス typedef struct { double *m; int row; int clm; }ARMat;
  *
  */
NyARMat = Klass(
{
  /**
    * 配列サイズと行列サイズは必ずしも一致しないことに注意 返された配列のサイズを行列の大きさとして使わないこと！
    *
    */
  m : null,
  __matrixSelfInv_nos : null,

  clm : null,
  row : null,

  initialize : function(i_row,i_clm)
  {
    this.m = new Array(i_row);
    for (var i=0; i<i_row; i++) {
      this.m[i] = new FloatVector(i_clm);
      for (var j=0; j<i_clm; j++)
        this.m[i][j] = 0.0;
    }
    this.__matrixSelfInv_nos=new FloatVector(i_row);
    this.clm = i_clm;
    this.row = i_row;
    return;
  }
  /**
    * 行列の列数を返します。
    * @return
    */
  ,getClm : function()
  {
    return this.clm;
  }
  /**
    * 行列の行数を返します。
    * @return
    */
  ,getRow : function()
  {
    return this.row;
  }
  ,getArray : function()
  {
    return this.m;
  }
  /**
    * 逆行列を計算して、thisへ格納します。
    * @throws NyARException
    */
  ,matrixSelfInv : function()
  {
    var ap = this.m;
    var dimen = this.row;
    var dimen_1 = dimen - 1;
    var ap_n, ap_ip, ap_i;// wap;
    var j, ip, nwork;
    var nos = this.__matrixSelfInv_nos;//ワーク変数
    // double epsl;
    var p, pbuf, work;

    /* check size */
    switch (dimen) {
    case 0:
      throw new NyARException();
    case 1:
      ap[0][0] = 1.0 / ap[0][0];// *ap = 1.0 / (*ap);
      return true;/* 1 dimension */
    }
    var n;
    for (n = 0; n < dimen; n++) {
      nos[n] = n;
    }

    /*
      * nyatla memo ipが定まらないで計算が行われる場合があるので挿入。 ループ内で0初期化していいかが判らない。
      */
    ip = 0;
    // For順変更禁止
    for (n = 0; n < dimen; n++) {
      ap_n = ap[n];// wcp = ap + n * rowa;
      p = 0.0;
      for (var i = n; i < dimen; i++) {
        if (p < (pbuf = Math.abs(ap[i][0]))) {
          p = pbuf;
          ip = i;
        }
      }
      // if (p <= matrixSelfInv_epsl){
      if (p == 0.0) {
        return false;
        // throw new NyARException();
      }

      nwork = nos[ip];
      nos[ip] = nos[n];
      nos[n] = nwork;

      ap_ip = ap[ip];
      for (j = 0; j < dimen; j++) {// for(j = 0, wap = ap + ip * rowa,
                      // wbp = wcp; j < dimen ; j++) {
        work = ap_ip[j]; // work = *wap;
        ap_ip[j] = ap_n[j];
        ap_n[j] = work;
      }

      work = ap_n[0];
      for (j = 0; j < dimen_1; j++) {
        ap_n[j] = ap_n[j + 1] / work;// *wap = *(wap + 1) / work;
      }
      ap_n[j] = 1.0 / work;// *wap = 1.0 / work;
      for (i = 0; i < dimen; i++) {
        if (i != n) {
          ap_i = ap[i];// wap = ap + i * rowa;
          work = ap_i[0];
          for (j = 0; j < dimen_1; j++) {// for(j = 1, wbp = wcp,work = *wap;j < dimen ;j++, wap++, wbp++)
            ap_i[j] = ap_i[j + 1] - work * ap_n[j];// wap = *(wap +1) - work *(*wbp);
          }
          ap_i[j] = -work * ap_n[j];// *wap = -work * (*wbp);
        }
      }
    }

    for (n = 0; n < dimen; n++) {
      for (j = n; j < dimen; j++) {
        if (nos[j] == n) {
          break;
        }
      }
      nos[j] = nos[n];
      for (i = 0; i < dimen; i++) {
        ap_i = ap[i];
        work = ap_i[j];// work = *wap;
        ap_i[j] = ap_i[n];// *wap = *wbp;
        ap_i[n] = work;// *wbp = work;
      }
    }
    return true;
  }
})

ArrayUtils = ASKlass('ArrayUtils',
{
  create2dInt : function(height, width)
  {
    var r = new Array(height);
    for (var i = 0; i < height; i++){
      r[i] = new IntVector(width);
    }
    return r;
  }
  ,create2dNumber : function(height, width)
  {
    var r = new Array(height);
    for (var i = 0; i < height; i++){
      r[i] = new FloatVector(width);
    }
    return r;
  }
  ,copyInt : function(src, srcPos, dest, destPos, length) {
    for (var i = 0; i < length; i++) {
      dest[destPos + i] = src[srcPos + i];
    }
  }
})
