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
NyARRasterAnalyzer_Histogram = ASKlass('NyARRasterAnalyzer_Histogram',
{
  _histImpl : null,
  /**
   * ヒストグラム解析の縦方向スキップ数。継承クラスはこのライン数づつ
   * スキップしながらヒストグラム計算を行うこと。
   */
  _vertical_skip : 0,
  NyARRasterAnalyzer_Histogram : function(i_raster_format, i_vertical_interval)
  {
    if(!this.initInstance(i_raster_format,i_vertical_interval)){
      throw new NyARException();
    }
  }
  ,initInstance : function(i_raster_format,i_vertical_interval)
  {
    switch (i_raster_format) {
    case NyARBufferType.INT1D_GRAY_8:
      this._histImpl = new NyARRasterThresholdAnalyzer_Histogram_INT1D_GRAY_8();
      break;
    case NyARBufferType.INT1D_X8R8G8B8_32:
      this._histImpl = new NyARRasterThresholdAnalyzer_Histogram_INT1D_X8R8G8B8_32();
      break;
    default:
      return false;
    }
    //初期化
    this._vertical_skip=i_vertical_interval;
    return true;
  }
  ,setVerticalInterval : function(i_step)
  {
    this._vertical_skip=i_step;
    return;
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
    return this._histImpl.createHistogram(i_input, size,h,this._vertical_skip);
  }
})
ICreateHistogramImpl = ASKlass('ICreateHistogramImpl',
{
  createHistogram : function(i_reader,i_size,o_histgram,i_skip){}
})

NyARRasterThresholdAnalyzer_Histogram_INT1D_GRAY_8 = ASKlass('NyARRasterThresholdAnalyzer_Histogram_INT1D_GRAY_8', ICreateHistogramImpl,
{
  createHistogram : function(i_reader,i_size,o_histgram,i_skip)
  {
    NyAS3Utils.assert (i_reader.isEqualBufferType(NyARBufferType.INT1D_GRAY_8));
    var input=(IntVector)(i_reader.getBuffer());
    for (var y = i_size.h-1; y >=0 ; y-=i_skip){
      var pt=y*i_size.w;
      for (var x = i_size.w-1; x >=0; x--) {
        o_histgram[input[pt]]++;
        pt++;
      }
    }
    return i_size.w*i_size.h;
  }
})
NyARRasterThresholdAnalyzer_Histogram_INT1D_X8R8G8B8_32 = ASKlass('NyARRasterThresholdAnalyzer_Histogram_INT1D_X8R8G8B8_32', ICreateHistogramImpl,
{
  createHistogram : function(i_reader,i_size,o_histgram,i_skip)
  {
    NyAS3Utils.assert (i_reader.isEqualBufferType(NyARBufferType.INT1D_X8R8G8B8_32));
    var input =(i_reader.getBuffer());
    for (var y = i_size.h-1; y >=0 ; y-=i_skip){
      var pt=y*i_size.w;
      for (var x = i_size.w-1; x >=0; x--) {
        var p=input[pt];
        o_histgram[((p& 0xff)+(p& 0xff)+(p& 0xff))/3]++;
        pt++;
      }
    }
    return i_size.w*i_size.h;
  }
})
INyARRasterThresholdAnalyzer = ASKlass('INyARRasterThresholdAnalyzer',
{
  analyzeRaster : function(i_input){}
})
NyARRasterThresholdAnalyzer_SlidePTile = ASKlass('NyARRasterThresholdAnalyzer_SlidePTile', INyARRasterThresholdAnalyzer,
{
  _raster_analyzer : null,
  _sptile : null,
  _histgram : null,
  NyARRasterThresholdAnalyzer_SlidePTile : function(i_persentage, i_raster_format, i_vertical_interval)
  {
    NyAS3Utils.assert (0 <= i_persentage && i_persentage <= 50);
    //初期化
    if(!this.initInstance(i_raster_format,i_vertical_interval)){
      throw new NyARException();
    }
    this._sptile=new NyARHistogramAnalyzer_SlidePTile(i_persentage);
    this._histgram=new NyARHistogram(256);
  }
  ,initInstance : function(i_raster_format,i_vertical_interval)
  {
    this._raster_analyzer=new NyARRasterAnalyzer_Histogram(i_raster_format,i_vertical_interval);
    return true;
  }
  ,setVerticalInterval : function(i_step)
  {
    this._raster_analyzer.setVerticalInterval(i_step);
    return;
  }
  ,analyzeRaster : function(i_input)
  {
    this._raster_analyzer.analyzeRaster(i_input, this._histgram);
    return this._sptile.getThreshold(this._histgram);
  }
})
