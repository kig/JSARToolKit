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
INyARRasterFilter = ASKlass('INyARRasterFilter',
{
  doFilter : function(i_input,i_output){}
})
INyARRasterFilter_Gs2Bin = ASKlass('INyARRasterFilter_Gs2Bin',
{
  doFilter : function(i_input, i_output){}
})
INyARRasterFilter_Rgb2Gs = ASKlass('INyARRasterFilter_Rgb2Gs',
{
  doFilter : function(i_input,i_output){}
})
INyARRasterFilter_Rgb2Bin = ASKlass('INyARRasterFilter_Rgb2Bin',
{
  doFilter : function(i_input, i_output){}
})






/**
 * 定数閾値による2値化をする。
 *
 */
NyARRasterFilter_ARToolkitThreshold = ASKlass('NyARRasterFilter_ARToolkitThreshold', INyARRasterFilter_Rgb2Bin,
{
  _threshold : 0,
  _do_threshold_impl : null,
  NyARRasterFilter_ARToolkitThreshold : function(i_threshold, i_input_raster_type)
  {
    this._threshold = i_threshold;
    switch (i_input_raster_type) {
    case NyARBufferType.INT1D_X8R8G8B8_32:
      this._do_threshold_impl=new doThFilterImpl_BUFFERFORMAT_INT1D_X8R8G8B8_32();
      break;
    default:
      throw new NyARException();
    }
  }
  /**
   * 画像を２値化するための閾値。暗点&lt;=th&lt;明点となります。
   * @param i_threshold
   */
  ,setThreshold : function(i_threshold )
  {
    this._threshold = i_threshold;
  }
  ,doFilter : function(i_input,i_output)
  {
    NyAS3Utils.assert (i_output.isEqualBufferType(NyARBufferType.INT1D_BIN_8));
    NyAS3Utils.assert (i_input.getSize().isEqualSize_NyARIntSize(i_output.getSize()) == true);
    this._do_threshold_impl.doThFilter(i_input,i_output,i_output.getSize(), this._threshold);
    return;
  }
})





/*
 * ここから各ラスタ用のフィルタ実装
 */
IdoThFilterImpl = ASKlass('IdoThFilterImpl',
{
  doThFilter : function(i_input,i_output,i_size,i_threshold){},
})

doThFilterImpl_BUFFERFORMAT_INT1D_X8R8G8B8_32 = ASKlass('doThFilterImpl_BUFFERFORMAT_INT1D_X8R8G8B8_32', IdoThFilterImpl,
{
  doThFilter : function(i_input,i_output,i_size,i_threshold)
  {
    NyAS3Utils.assert (i_output.isEqualBufferType(NyARBufferType.INT1D_BIN_8));
    var out_buf = (IntVector)(i_output.getBuffer());
    var in_buf = (IntVector)(i_input.getBuffer());
    var th=i_threshold*3;
    var w;
    var xy;
    var pix_count=i_size.h*i_size.w;
    var pix_mod_part=pix_count-(pix_count%8);
    for(xy=pix_count-1;xy>=pix_mod_part;xy--){
      w=in_buf[xy];
      out_buf[xy]=(((w>>16)&0xff)+((w>>8)&0xff)+(w&0xff))<=th?0:1;
    }
    //タイリング
    for (;xy>=0;) {
      w=in_buf[xy];
      out_buf[xy]=(((w>>16)&0xff)+((w>>8)&0xff)+(w&0xff))<=th?0:1;
      xy--;
      w=in_buf[xy];
      out_buf[xy]=(((w>>16)&0xff)+((w>>8)&0xff)+(w&0xff))<=th?0:1;
      xy--;
      w=in_buf[xy];
      out_buf[xy]=(((w>>16)&0xff)+((w>>8)&0xff)+(w&0xff))<=th?0:1;
      xy--;
      w=in_buf[xy];
      out_buf[xy]=(((w>>16)&0xff)+((w>>8)&0xff)+(w&0xff))<=th?0:1;
      xy--;
      w=in_buf[xy];
      out_buf[xy]=(((w>>16)&0xff)+((w>>8)&0xff)+(w&0xff))<=th?0:1;
      xy--;
      w=in_buf[xy];
      out_buf[xy]=(((w>>16)&0xff)+((w>>8)&0xff)+(w&0xff))<=th?0:1;
      xy--;
      w=in_buf[xy];
      out_buf[xy]=(((w>>16)&0xff)+((w>>8)&0xff)+(w&0xff))<=th?0:1;
      xy--;
      w=in_buf[xy];
      out_buf[xy]=(((w>>16)&0xff)+((w>>8)&0xff)+(w&0xff))<=th?0:1;
      xy--;
    }
  }
})
