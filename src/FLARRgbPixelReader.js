/*
 * PROJECT: FLARToolKit
 * --------------------------------------------------------------------------------
 * This work is based on the NyARToolKit developed by
 *   R.Iizuka (nyatla)
 * http://nyatla.jp/nyatoolkit/
 *
 * The FLARToolKit is ActionScript 3.0 version ARToolkit class library.
 * Copyright (C)2008 Saqoosha
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
 *  http://www.libspark.org/wiki/saqoosha/FLARToolKit
 *  <saq(at)saqoosha.net>
 *
 */
FLARRgbPixelReader_BitmapData = ASKlass('FLARRgbPixelReader_BitmapData',
{
  _ref_bitmap : null
  ,FLARRgbPixelReader_BitmapData : function(i_buffer)
  {
    this._ref_bitmap = i_buffer;
  }
  ,getPixel : function(i_x, i_y, o_rgb)
  {
    var c = this._ref_bitmap.getPixel(i_x, i_y);
    o_rgb[0] = (c >> 16) & 0xff;// R
    o_rgb[1] = (c >> 8) & 0xff;// G
    o_rgb[2] = c & 0xff;// B
    return;
  }
  ,getPixelSet : function(i_x, i_y, i_num, o_rgb)
  {
    var bmp = this._ref_bitmap;
    var c;
    var i;
    for (i = 0; i < i_num; i++) {
      c = bmp.getPixel(i_x[i], i_y[i]);
      o_rgb[i*3+0] = (c >> 16) & 0xff;
      o_rgb[i*3+1] = (c >> 8) & 0xff;
      o_rgb[i*3+2] = c & 0xff;
    }
  }
  ,setPixel : function(i_x, i_y, i_rgb)
  {
    NyARException.notImplement();
  }
  ,setPixels : function(i_x, i_y, i_num, i_intrgb)
  {
    NyARException.notImplement();
  }
  ,switchBuffer : function(i_ref_buffer)
  {
    NyARException.notImplement();
  }
})
FLARGrayPixelReader_BitmapData = ASKlass('FLARGrayPixelReader_BitmapData',
{
  _ref_bitmap : null
  ,FLARGrayPixelReader_BitmapData : function(i_buffer)
  {
    this._ref_bitmap = i_buffer;
  }
  ,getPixel : function(i_x, i_y, i_num, o_gray)
  {
    NyARException.notImplement();
    var w = this._ref_bitmap.getWidth();
    var d = this._ref_bitmap.getBuffer();
    o_gray[0] = o_gray[1] = o_gray[2] = ~d(i_x + w*i_y) & 0xff;
  }
  ,getPixelSet : function(i_x, i_y, i_num, o_gray)
  {
    var w = this._ref_bitmap.getWidth();
    var d = this._ref_bitmap.data;
    for (var i = 0; i < i_num; i++) {
      o_gray[i] = ~d[i_x[i] + w*i_y[i]] & 0xff;
    }
  }
  ,setPixel : function(i_x, i_y, i_rgb)
  {
    NyARException.notImplement();
  }
  ,setPixels : function(i_x, i_y, i_num, i_intrgb)
  {
    NyARException.notImplement();
  }
  ,switchBuffer : function(i_ref_buffer)
  {
    NyARException.notImplement();
  }
})