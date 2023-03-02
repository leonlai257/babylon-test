import { Quaternion, Vector3 } from "@babylonjs/core";

export function createArcCurve(center = Vector3.Zero(), radius = 1, rotation = Quaternion.Zero(), startingTheta = 0, endingTheta = 2 * Math.PI, step = 1) {
  let deltaTheta = (Math.abs(startingTheta) + Math.abs(endingTheta)) / step;

  const path = [];
  for (let theta = startingTheta; theta < Math.min(endingTheta, 2 * Math.PI); theta += deltaTheta) {
    let temp = new Vector3(center.x + radius * Math.cos(theta), center.y + radius * Math.sin(theta), center.z);
    temp = temp.rotateByQuaternionAroundPointToRef(rotation, center.clone(), temp);
    path.push(temp);
  }
  return path;
}

export function createLine(startingPoint: Vector3, endingPoint: Vector3, step = 200) {
  let direction = endingPoint.subtract(startingPoint).normalizeToNew();
  let distance = Vector3.Distance(startingPoint, endingPoint);
  let deltaStep = distance / step;

  const path = [];

  for (let i = 0; i < step; i++) {
    path.push(startingPoint.add(direction.scale(i * deltaStep)));
  }

  return path;
}

export function createEllipse(center, radius, rotation, step): Vector3[] {
  let _a_square = radius.x ** 2;
  let _b_square = radius.y ** 2;
  let _a_times_b = radius.x * radius.y;
  let _ellispe_points = [];
  for (let i = 0; i < step; i++) {
    let result = Vector3.Zero();
    result = calculateEllipsePosition((Math.PI * 2 * i) / step, _a_square, _b_square, _a_times_b).rotateByQuaternionToRef(Quaternion.FromEulerAngles(rotation.x, rotation.y, rotation.z), result);
    _ellispe_points.push(result.add(center));
  }
  return _ellispe_points;
}

export function calculateEllipsePosition(radian, _a_square, _b_square, _a_times_b): Vector3 {
  let _tan = Math.tan(radian);
  let _tan_square = _tan ** 2;
  let _denominator = (_b_square + _a_square * _tan_square) ** 0.5;
  let _reverse_denominator = 1 / _denominator;

  //90°<𝜃<270°.
  let _ellipse_position = new Vector3(0, 0, 0);
  if (radian > Math.PI * 0.5 && radian < Math.PI * 1.5) {
    _ellipse_position.x = +_a_times_b * _reverse_denominator;
    _ellipse_position.y = +(_a_times_b * _tan) * _reverse_denominator;
  } else {
    _ellipse_position.x = -_a_times_b * _reverse_denominator;
    _ellipse_position.y = -(_a_times_b * _tan) * _reverse_denominator;
  }
  return _ellipse_position;
}

export function createLineCurve(center, dist) {
  const NORMAL_VECTOR = new Vector3(0, 0, 1);
  const TARGENT_VECTOR = new Vector3(1, 0, 0);

  let startingPoint = center.add(NORMAL_VECTOR.scale(dist)).add(TARGENT_VECTOR.scale(Math.min(dist / 2, 4.5)));
  let endingPoint = center.add(NORMAL_VECTOR.scale(dist)).subtract(TARGENT_VECTOR.scale(Math.min(dist / 2, 4.5)));

  return createLine(startingPoint, endingPoint, 200);
}

export function calculateClosestPoint(target: Vector3, points: Vector3[]): [Vector3, number] {
  let minDist = Number.MAX_SAFE_INTEGER;

  let tempDist;
  let result = null;

  points.forEach((point, index) => {
    tempDist = Vector3.Distance(target, point);
    // console.log("Point", tempDist, point);
    if (minDist >= tempDist) {
      minDist = tempDist;
      result = [point, index];
    }
  });
  return result;
}
