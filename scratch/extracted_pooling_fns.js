export const getPoolingDriverBookings = async (req, res) => {
  if (String(req.auth?.role || "").toLowerCase() !== "pooling_driver") {
    throw new ApiError(403, "Pooling driver access is required");
  }

  const bookings = await PoolingBooking.find({ vehicle: req.auth.sub })
    .populate("user", "name phone email")
    .populate("route", "routeName originLabel destinationLabel")
    .sort({ travelDate: -1, createdAt: -1 })
    .lean();

  res.json({
    success: true,
    data: bookings.map(serializePoolingDriverBooking),
  });
};

export const getOwnerPoolingVehicles = async (req, res) => {
  const owner = await resolveAuthenticatedOwner(req);

  if (!owner?._id) {
    throw new ApiError(
      403,
      "Pooling vehicle access is only available for owner accounts",
    );
  }

  const vehicles = await PoolingVehicle.find({ ownerId: owner._id })
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    success: true,
    data: vehicles,
    message: "Owner pooling vehicles fetched successfully",
  });
};

export const createOwnerPoolingVehicle = async (req, res) => {
  const owner = await resolveAuthenticatedOwner(req);

  if (!owner?._id) {
    throw new ApiError(
      403,
      "Pooling vehicle access is only available for owner accounts",
    );
  }

  const vehicle = await PoolingVehicle.create({
    ...(req.body || {}),
    ownerId: owner._id,
  });

  res.status(201).json({
    success: true,
    data: vehicle,
    message: "Pooling vehicle created successfully",
  });
};

export const updateOwnerPoolingVehicle = async (req, res) => {
  const owner = await resolveAuthenticatedOwner(req);

  if (!owner?._id) {
    throw new ApiError(
      403,
      "Pooling vehicle access is only available for owner accounts",
    );
  }

  const vehicle = await PoolingVehicle.findOneAndUpdate(
    { _id: req.params.vehicleId, ownerId: owner._id },
    { ...(req.body || {}), ownerId: owner._id },
    { new: true, runValidators: true },
  );

  if (!vehicle) {
    throw new ApiError(404, "Pooling vehicle not found");
  }

  res.json({
    success: true,
    data: vehicle,
    message: "Pooling vehicle updated successfully",
  });
};

export const deleteOwnerPoolingVehicle = async (req, res) => {
  const owner = await resolveAuthenticatedOwner(req);

  if (!owner?._id) {
    throw new ApiError(
      403,
      "Pooling vehicle access is only available for owner accounts",
    );
  }

  const vehicle = await PoolingVehicle.findOneAndDelete({
    _id: req.params.vehicleId,
    ownerId: owner._id,
  });

  if (!vehicle) {
    throw new ApiError(404, "Pooling vehicle not found");
  }

  res.json({
    success: true,
    data: { deleted: true },
    message: "Pooling vehicle deleted successfully",
  });
};

export const startPoolingOnboardingRequest = async (req, res) => {
  const result = await startPoolingDriverOnboarding(req.body);
  res.status(201).json({ success: true, data: result });
};

export const verifyPoolingOnboardingOtpRequest = async (req, res) => {
  const result = await verifyPoolingDriverOnboardingOtp(req.body);
  res.json({ success: true, data: result });
};

export const getPoolingOnboardingSessionRequest = async (req, res) => {
  const result = await getPoolingDriverOnboardingSession({
    registrationId: req.params.registrationId,
    phone: req.query.phone,
  });
  res.json({ success: true, data: result });
};

export const savePoolingOnboardingDetailsRequest = async (req, res) => {
  const result = await savePoolingDriverOnboardingDetails(req.body);
  res.json({ success: true, data: result });
};

export const completePoolingOnboardingRequest = async (req, res) => {
  const result = await completePoolingDriverOnboarding(req.body);
  res.status(201).json({ success: true, data: result });
};

export const uploadPoolingOnboardingImageRequest = async (req, res) => {
  const image = String(req.body?.image || "").trim();

  if (!image) {
    throw new ApiError(400, "Image data is required");
  }

  const result = await uploadDataUrlToCloudinary({
    dataUrl: image,
    publicIdPrefix: "pooling-driver-onboarding",
  });

  res.status(201).json({
    success: true,
    data: {
      url: result.secureUrl,
    },
  });
};

