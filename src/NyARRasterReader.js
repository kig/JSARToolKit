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
 *  ilmari.heikkinen@gmail.com
 *
 */

/**
 * R8G8B8でピクセルを読み出すインタフェイス
 *
 */
INyARRgbPixelReader = ASKlass('INyARRgbPixelReader', {
  /**
   * 1ピクセルをint配列にして返します。
   *
   * @param i_x
   * @param i_y
   * @param o_rgb
   */
  getPixel : function(i_x, i_y, o_rgb){},
  /**
   * 複数のピクセル値をi_rgbへ返します。
   *
   * @param i_x
   * xのインデックス配列
   * @param i_y
   * yのインデックス配列
   * @param i_num
   * 返すピクセル値の数
   * @param i_rgb
   * ピクセル値を返すバッファ
   */
  getPixelSet : function(i_x, i_y, i_num, o_rgb){},
  /**
   * 1ピクセルを設定します。
   * @param i_x
   * @param i_y
   * @param i_rgb
   * @throws NyARException
   */
  setPixel : function(i_x, i_y, i_rgb){},
  /**
   * 複数のピクセル値をint配列から設定します。
   * @param i_x
   * @param i_y
   * @param i_num
   * @param i_intrgb
   * @throws NyARException
   */
  setPixels : function(i_x, i_y, i_num, i_intrgb){},
  switchBuffer : function(i_ref_buffer){}
})
NyARRgbPixelReader_INT1D_X8R8G8B8_32 = ASKlass('NyARRgbPixelReader_INT1D_X8R8G8B8_32', INyARRgbPixelReader,
{
  _ref_buf : null,
  _size : null,
  NyARRgbPixelReader_INT1D_X8R8G8B8_32 : function(i_buf, i_size)
  {
    this._ref_buf = i_buf;
    this._size = i_size;
  }
  ,getPixel : function(i_x,i_y,o_rgb)
  {
    var rgb= this._ref_buf[i_x + i_y * this._size.w];
    o_rgb[0] = (rgb>>16)&0xff;// R
    o_rgb[1] = (rgb>>8)&0xff;// G
    o_rgb[2] = rgb&0xff;// B
    return;
  }
  ,getPixelSet : function(i_x,i_y,i_num, o_rgb)
  {
    var width = this._size.w;
    var ref_buf = this._ref_buf;
    for (var i = i_num - 1; i >= 0; i--) {
      var rgb=ref_buf[i_x[i] + i_y[i] * width];
      o_rgb[i * 3 + 0] = (rgb>>16)&0xff;// R
      o_rgb[i * 3 + 1] = (rgb>>8)&0xff;// G
      o_rgb[i * 3 + 2] = rgb&0xff;// B
    }
    return;
  }
  ,setPixel : function(i_x,i_y,i_rgb)
  {
    this._ref_buf[i_x + i_y * this._size.w]=((i_rgb[0]<<16)&0xff)|((i_rgb[1]<<8)&0xff)|((i_rgb[2])&0xff);
  }
  ,setPixels : function(i_x,i_y, i_num,i_intrgb)
  {
    throw new NyARException();
  }
  /**
   * 参照しているバッファをi_ref_bufferへ切り替えます。
   * 内部パラメータのチェックは、実装依存です。
   * @param i_ref_buffer
   * @throws NyARException
   */
  ,switchBuffer : function(i_ref_buffer)
  {
    NyAS3Utils.assert(i_ref_buffer.length>=this._size.w*this._size.h);
    this._ref_buf = (i_ref_buffer);
  }
})


NyARRgbPixelReader_Canvas2D = ASKlass("NyARRgbPixelReader_Canvas2D", INyARRgbPixelReader,
{
  _ref_canvas: null,
  _data : null,

  NyARRgbPixelReader_Canvas2D : function(i_canvas)
  {
    this._ref_canvas = i_canvas;
  },

  getData : function() {
    if (this._ref_canvas.changed || !this._data) {
      var canvas = this._ref_canvas;
      var ctx = canvas.getContext('2d');
      this._data = ctx.getImageData(0,0,canvas.width,canvas.height);
      this._ref_canvas.changed = false;
    }
    return this._data;
  },

  getPixel: function(i_x, i_y, o_rgb)
  {
    var idata = this.getData();
    var w = idata.width;
    var h = idata.height;
    var d = idata.data;
    o_rgb[0] = d[i_y*w+i_x];// R
    o_rgb[1] = d[i_y*w+i_x+1];// G
    o_rgb[2] = d[i_y*w+i_x+2];// B
    return;
  },

  getPixelSet: function(i_x, i_y, i_num, o_rgb)
  {
    var idata = this.getData();
    var w = idata.width;
    var h = idata.height;
    var d = idata.data;
    for (var i = 0; i < i_num; i++) {
      var idx = i_y[i]*w*4 + i_x[i]*4;
      o_rgb[i*3+0] = d[idx+0];
      o_rgb[i*3+1] = d[idx+1];
      o_rgb[i*3+2] = d[idx+2];
    }
  },

  setPixel: function(i_x, i_y, i_rgb)
  {
    NyARException.notImplement();
  },
  setPixels: function(i_x, i_y, i_num, i_intrgb)
  {
    NyARException.notImplement();
  },
  switchBuffer:function(i_canvas)
  {
    NyARException.notImplement();
  }

})

