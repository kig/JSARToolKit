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
 * typedef struct { int xsize, ysize; double mat[3][4]; double dist_factor[4]; } ARParam;
 * NyARの動作パラメータを格納するクラス
 *
 * @see jp.nyatla.nyartoolkit.as3.core.param.NyARParam
 */
FLARParam = ASKlass('FLARParam', NyARParam,
{
  FLARParam : function(w,h)
  {
    w = w || 640;
    h = h || 480;
    this._screen_size.w = w;
    this._screen_size.h = h;
    var f = (w/h) / (4/3);
    var dist = new FloatVector([w/2, 1.1*h/2, 26.2, 1.0127565206658486]);
    var projection = new FloatVector([f*700.9514702992245, 0, w/2-0.5, 0,
                                      0, 726.0941816535367, h/2-0.5, 0,
                                      0, 0,                 1,     0]);
    this.setValue(dist, projection);
  }

})
