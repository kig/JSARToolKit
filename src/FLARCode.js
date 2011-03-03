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
FLARCode = ASKlass('FLARCode', NyARCode,
{
  markerPercentWidth : 50
  ,markerPercentHeight : 50
  /**
   *
   * @param  i_width          幅方向の分割数
   * @param  i_height        高さ方向の分割数
   * @param  i_markerPercentWidth  マーカ全体(本体＋枠)における、マーカ本体部分の割合(幅)
   * @param  i_markerPercentHeight  マーカ全体(本体＋枠)における、マーカ本体部分の割合(高さ)
   */
  ,FLARCode : function(i_width, i_height,i_markerPercentWidth,  i_markerPercentHeight)
  {
    NyARCode.initialize.call(this, i_width, i_height);
    this.markerPercentWidth = i_markerPercentWidth == null ? 50 : i_markerPercentWidth;
    this.markerPercentHeight = i_markerPercentHeight == null ? 50 : i_markerPercentHeight;
  }
  ,loadARPatt : function(i_stream)
  {
    NyARCode.loadARPattFromFile.call(this, i_stream);
    return;
  }
})
