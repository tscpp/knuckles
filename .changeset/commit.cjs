module.exports.getAddMessage = async () => {
  return `docs(changeset): add changeset [skip ci]`;
};

module.exports.getVersionMessage = async (releasePlan) => {
  const publishableReleases = releasePlan.releases.filter(
    (release) => release.type !== "none",
  );

  return (
    `chore(release): version ${publishableReleases.length} package(s) [skip ci]` +
    "\n\n" +
    publishableReleases
      .map((release) => `- ${release.name}@${release.newVersion}`)
      .join("\n")
  );
};
