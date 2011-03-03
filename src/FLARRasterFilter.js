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



/**
 * 各ラスタ用のフィルタ実装
 */
IFLdoThFilterImpl = ASKlass('IFLdoThFilterImpl',
{
  doThFilter : function(i_input,i_output,i_size,i_threshold){}
})


/**
 * 定数閾値による2値化をする。
 *
 */
FLARRasterFilter_Threshold = ASKlass('FLARRasterFilter_Threshold',
{
  _threshold : 0
  ,_do_threshold_impl : null
  ,FLARRasterFilter_Threshold : function(i_threshold)
  {
  }
  /**
   * 画像を２値化するための閾値。暗点&lt;=th&lt;明点となります。
   * @param i_threshold
   */
  ,setThreshold : function(i_threshold )
  {
    this._threshold = i_threshold;
  }
  ,doFilter : function(i_input, i_output)
  {
    NyAS3Utils.assert (i_input._width == i_output._width && i_input._height == i_output._height);
    var out_buf = (i_output.getBuffer());
    var in_reader = i_input.getRgbPixelReader();
    var d = in_reader.getData().data;
    var obd = out_buf.data;
    var th3 = this._threshold*10000;
    for (var i=0,j=0; i<d.length; i+=4,++j) {
      //var c = d[i]*0.2989 + d[i+1]*0.5866 + d[i+2]*0.1145;
      var c = d[i]*2989+d[i+1]*5866+d[i+2]*1145;
      var t = (c <= th3) ? 0xffffffff : 0xff000000;
      obd[j] = t;
    }
    if (window.DEBUG) {
      var debugCanvas = document.getElementById('debugCanvas');
      out_buf.drawOnCanvas(debugCanvas);
    }
    return;
  }
})
Point = function(x,y) {
  this.x = x||0;
  this.y = y||0;
}
doThFilterImpl_BUFFERFORMAT_OBJECT_AS_BitmapData = {
  doThFilter : function(i_input, i_output, i_threshold)
  {
    var out_buf = (i_output.getBuffer());
    var in_buf= (i_input.getBuffer());
    var d = in_buf.data;
    var obd = out_buf.data;
    for (var i=0; i<d.length; i++) {
      var dc = d[i];
      var c = ((dc>>16)&0xff)*0.2989 + ((dc>>8)&0xff)*0.5866 + (dc&0xff)*0.1145;
      var f = (c <= i_threshold);
      var t = f*0xffffffff + (1-f)*0xff000000;
      obd[j] = t;
    }
  }
}