package crypto

import (
	"fmt"
	"os"
)

func loadRSAKeyBytes(pathEnv, label string) ([]byte, error) {
	if path := os.Getenv(pathEnv); path != "" {
		data, err := os.ReadFile(path)
		if err != nil {
			return nil, fmt.Errorf("failed to read %s from %s (%s): %w", label, pathEnv, path, err)
		}
		return data, nil
	}

	return nil, fmt.Errorf("%s not set (expected %s to point to a PEM file)", label, pathEnv)
}

func loadRSAPrivateKeyBytes() ([]byte, error) {
	return loadRSAKeyBytes("NOFX_RSA_PRIVATE_KEY_PATH", "RSA private key")
}

func loadRSAPublicKeyBytes() ([]byte, error) {
	return loadRSAKeyBytes("NOFX_RSA_PUBLIC_KEY_PATH", "RSA public key")
}
