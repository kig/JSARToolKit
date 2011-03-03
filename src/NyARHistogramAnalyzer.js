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
INyARHistogramAnalyzer_Threshold = ASKlass('INyARHistogramAnalyzer_Threshold',
{
  getThreshold : function(i_histgram){}
})
NyARHistogramAnalyzer_SlidePTile = ASKlass('NyARHistogramAnalyzer_SlidePTile', INyARHistogramAnalyzer_Threshold,
{
  _persentage : 0,
  NyARHistogramAnalyzer_SlidePTile : function(i_persentage)
  {
    NyAS3Utils.assert (0 <= i_persentage && i_persentage <= 50);
    //初期化
    this._persentage=i_persentage;
  }
  ,getThreshold : function(i_histgram)
  {
    //総ピクセル数を計算
    var n=i_histgram.length;
    var sum_of_pixel=i_histgram.total_of_data;
    var hist=i_histgram.data;
    // 閾値ピクセル数確定
    var th_pixcels = sum_of_pixel * this._persentage / 100;
    var th_wk;
    var th_w, th_b;
    // 黒点基準
    th_wk = th_pixcels;
    for (th_b = 0; th_b < n-2; th_b++) {
      th_wk -= hist[th_b];
      if (th_wk <= 0) {
        break;
      }
    }
    // 白点基準
    th_wk = th_pixcels;
    for (th_w = n-1; th_w > 1; th_w--) {
      th_wk -= hist[th_w];
      if (th_wk <= 0) {
        break;
      }
    }
    // 閾値の保存
    return (th_w + th_b) / 2;
  }
})
