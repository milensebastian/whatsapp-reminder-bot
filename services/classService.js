const ClassModel = require("../models/Class");
const User = require("../models/User");

async function syncClassMembers(classDoc, memberIds) {
  const uniqueIds = [...new Set((memberIds || []).filter(Boolean).map(String))];

  await User.updateMany(
    { classId: classDoc._id, _id: { $nin: uniqueIds } },
    {
      $set: {
        classId: null,
      },
    }
  );

  if (uniqueIds.length) {
    await User.updateMany(
      { _id: { $in: uniqueIds } },
      {
        $set: {
          classId: classDoc._id,
          year: classDoc.year,
          department: classDoc.department,
          role: "student",
        },
      }
    );
  }
}

async function createClass(payload) {
  const classDoc = await ClassModel.create({
    name: payload.name,
    year: payload.year,
    department: payload.department,
    members: payload.members || [],
  });

  await syncClassMembers(classDoc, classDoc.members);
  return getClassById(classDoc._id);
}

async function getClasses() {
  return ClassModel.find({}).populate("members", "name phone department year classId").sort({ createdAt: -1 }).lean();
}

async function getClassById(id) {
  const classDoc = await ClassModel.findById(id).populate("members", "name phone department year classId").lean();
  if (!classDoc) {
    throw new Error("Class not found");
  }

  return classDoc;
}

async function updateClass(id, payload) {
  const classDoc = await ClassModel.findById(id);
  if (!classDoc) {
    throw new Error("Class not found");
  }

  if (payload.name !== undefined) classDoc.name = payload.name;
  if (payload.year !== undefined) classDoc.year = payload.year;
  if (payload.department !== undefined) classDoc.department = payload.department;
  if (payload.members !== undefined) classDoc.members = payload.members;

  await classDoc.save();
  await syncClassMembers(classDoc, classDoc.members);
  return getClassById(classDoc._id);
}

async function deleteClass(id) {
  const classDoc = await ClassModel.findById(id);
  if (!classDoc) {
    throw new Error("Class not found");
  }

  await User.updateMany(
    { classId: classDoc._id },
    {
      $set: {
        classId: null,
      },
    }
  );

  await classDoc.deleteOne();
  return { deleted: true, id };
}

async function addStudentToClass(id, userId) {
  const classDoc = await ClassModel.findById(id);
  if (!classDoc) {
    throw new Error("Class not found");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("Student not found");
  }

  if (!classDoc.members.some((memberId) => String(memberId) === String(userId))) {
    classDoc.members.push(userId);
    await classDoc.save();
  }

  await User.findByIdAndUpdate(userId, {
    $set: {
      classId: classDoc._id,
      year: classDoc.year,
      department: classDoc.department,
      role: "student",
    },
  });

  return getClassById(classDoc._id);
}

async function removeStudentFromClass(id, userId) {
  const classDoc = await ClassModel.findById(id);
  if (!classDoc) {
    throw new Error("Class not found");
  }

  classDoc.members = classDoc.members.filter(
    (memberId) => String(memberId) !== String(userId)
  );
  await classDoc.save();

  await User.findByIdAndUpdate(userId, {
    $set: {
      classId: null,
    },
  });

  return getClassById(classDoc._id);
}

async function getClassMembers(id) {
  const classDoc = await ClassModel.findById(id).populate("members", "name phone department year classId");
  if (!classDoc) {
    throw new Error("Class not found");
  }

  return classDoc.members;
}

module.exports = {
  createClass,
  getClasses,
  getClassById,
  updateClass,
  deleteClass,
  addStudentToClass,
  removeStudentFromClass,
  getClassMembers,
};
