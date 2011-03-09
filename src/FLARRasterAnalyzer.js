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
FLARRasterAnalyzer_Histogram = ASKlass('FLARRasterAnalyzer_Histogram', NyARRasterAnalyzer_Histogram,
{
  FLARRasterAnalyzer_Histogram : function(i_vertical_interval)
  {
    NyARRasterAnalyzer_Histogram.initialize.call(this,NyARBufferType.OBJECT_AS3_BitmapData,i_vertical_interval);
  }
  ,initInstance : function(i_raster_format,i_vertical_interval)
  {
    if (i_raster_format != NyARBufferType.OBJECT_AS3_BitmapData) {
      return false;
    }else {
      this._vertical_skip = i_vertical_interval;
    }
    return true;
  }
  /**
   * o_histgramにヒストグラムを出力します。
   * @param i_input
   * @param o_histgram
   * @return
   * @throws NyARException
   */
  ,analyzeRaster : function(i_input,o_histgram)
  {
    var size=i_input.getSize();
    //最大画像サイズの制限
    NyAS3Utils.assert(size.w*size.h<0x40000000);
    NyAS3Utils.assert(o_histgram.length == 256);//現在は固定
    var  h=o_histgram.data;
    //ヒストグラム初期化
    for (var i = o_histgram.length-1; i >=0; i--){
      h[i] = 0;
    }
    o_histgram.total_of_data=size.w*size.h/this._vertical_skip;
    return this.createHistgram_AS3_BitmapData(i_input, size,h,this._vertical_skip);
  }
  ,createHistgram_AS3_BitmapData : function(i_reader,i_size,o_histgram,i_skip)
  {
    //[Todo:]この方法だとパフォーマンスでないから、Bitmapdataの
    NyAS3Utils.assert (i_reader.isEqualBufferType(NyARBufferType.OBJECT_AS3_BitmapData));
    var input=(i_reader.getBuffer());
    for (var y = i_size.h-1; y >=0 ; y-=i_skip){
      var pt=y*i_size.w;
      for (var x = i_size.w - 1; x >= 0; x--) {
        var p=input.getPixel(x,y);
        o_histgram[toInt((((p>>8)&0xff)+((p>>16)&0xff)+(p&0xff))/3)]++;
        pt++;
      }
    }
    return i_size.w*i_size.h;
  }
})

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
FLARRasterThresholdAnalyzer_SlidePTile = ASKlass('FLARRasterThresholdAnalyzer_SlidePTile', NyARRasterThresholdAnalyzer_SlidePTile,
{
  FLARRasterThresholdAnalyzer_SlidePTile : function(i_persentage, i_vertical_interval)
  {
    NyARRasterThresholdAnalyzer_SlidePTile.initialize.call(this,i_persentage, NyARBufferType.OBJECT_AS3_BitmapData,i_vertical_interval);
  }
  ,initInstance : function(i_raster_format,i_vertical_interval)
  {
    if (i_raster_format != NyARBufferType.OBJECT_AS3_BitmapData) {
      return false;
    }
    this._raster_analyzer=new FLARRasterAnalyzer_Histogram(i_vertical_interval);
    return true;
  }
})
