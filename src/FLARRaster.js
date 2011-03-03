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


FLARCanvas = function(w,h) {
  var c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}



FLARBinRaster = ASKlass('FLARBinRaster', NyARBinRaster,
{
  FLARBinRaster : function(i_width,i_height)
  {
    NyARBinRaster.initialize.call(this,i_width,i_height,NyARBufferType.OBJECT_AS3_BitmapData,true);
    this._gray_reader = new FLARGrayPixelReader_BitmapData(this._buf);
  }
  ,initInstance : function(i_size,i_buf_type,i_is_alloc)
  {
    this._buf = i_is_alloc?new BitmapData(i_size.w,i_size.h,0x00):null;
    return true;
  }
  ,getGrayPixelReader : function() {
    return this._gray_reader;
  }
})


FLARRgbRaster_BitmapData = ASKlass('FLARRgbRaster_BitmapData', NyARRgbRaster_BasicClass,
{
  _bitmapData : null
  ,_rgb_reader : null
  /**
   *
   * @deprecated 次バージョンで次のように変更されます。 FLARRgbRaster_BitmapData(i_width,i_height)
   */
  ,FLARRgbRaster_BitmapData : function(bitmapData) {
    NyARRgbRaster_BasicClass.initialize.call(this,bitmapData.width, bitmapData.height,NyARBufferType.OBJECT_AS3_BitmapData);
    this._bitmapData = bitmapData;
    this._rgb_reader = new FLARRgbPixelReader_BitmapData(this._bitmapData);
  }
  ,getRgbPixelReader : function()
  {
    return this._rgb_reader;
  }
  ,getBuffer : function()
  {
    return this._bitmapData;
  }
  ,hasBuffer : function()
  {
    return this._bitmapData != null;
  }
})
